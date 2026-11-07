/**
 * Forms tools for the MCP server.
 *
 * Backed by `GET /forms`, `GET /forms/:id`, `GET /forms/:id/submissions`,
 * `GET /forms/:id/submissions/:subId` and
 * `PUT /forms/:id/submissions/:subId/status` on the Reverso API.
 */

import { z } from 'zod';
import type { ReversoApiClient } from '../api-client.js';

export const formStatusSchema = z.enum(['draft', 'published', 'archived']);
export const submissionStatusSchema = z.enum(['new', 'read', 'spam', 'archived']);
export type FormStatus = z.infer<typeof formStatusSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

/** `GET /forms` item. */
export interface FormSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: FormStatus;
  isMultiStep: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `GET /forms/:id`. */
export interface FormDetail extends FormSummary {
  fields: Array<Record<string, unknown> & { id: string; name: string; type: string; label: string }>;
  submissionStats: { total: number; new?: number; read?: number; spam?: number } & Record<string, unknown>;
  [key: string]: unknown;
}

/** `GET /forms/:id/submissions` item. */
export interface SubmissionSummary {
  id: string;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  ipAddress: string | null;
  referrer: string | null;
  createdAt: string;
}

/** `GET /forms/:id/submissions/:subId`. */
export interface SubmissionDetail extends SubmissionSummary {
  formId: string;
  userAgent: string | null;
  attachments: unknown;
  webhookSentAt: string | null;
}

interface SubmissionsMeta {
  total: number;
  new: number;
  read: number;
  spam: number;
}

const formPath = (formId: string) => `/forms/${encodeURIComponent(formId)}`;

async function getForm(api: ReversoApiClient, formId: string): Promise<FormDetail> {
  const { data } = await api.get<FormDetail>(formPath(formId));
  return data;
}

export const formsTools = {
  list_forms: {
    description: 'List all forms in the CMS',
    inputSchema: z.object({
      status: formStatusSchema.optional().describe('Filter by form status'),
      includeFields: z.boolean().optional().describe('Include form fields in response'),
    }),
    handler: async (api: ReversoApiClient, input: { status?: FormStatus; includeFields?: boolean }) => {
      const { data } = await api.get<FormSummary[]>('/forms');
      const forms = input.status ? data.filter((f) => f.status === input.status) : data;

      if (!input.includeFields) {
        return { forms, total: forms.length };
      }

      const withFields = await Promise.all(
        forms.map(async (form) => {
          const detail = await getForm(api, form.id);
          return { ...form, fields: detail.fields };
        })
      );
      return { forms: withFields, total: withFields.length };
    },
  },

  get_form: {
    description: 'Get a specific form by ID or slug with all its fields',
    inputSchema: z.object({
      id: z.string().optional().describe('Form ID'),
      slug: z.string().optional().describe('Form slug'),
    }),
    handler: async (api: ReversoApiClient, input: { id?: string; slug?: string }) => {
      if (input.id) {
        return getForm(api, input.id);
      }
      if (!input.slug) {
        throw new Error('Either id or slug must be provided');
      }
      const { data: forms } = await api.get<FormSummary[]>('/forms');
      const match = forms.find((f) => f.slug === input.slug);
      if (!match) {
        throw new Error(`Form not found: ${input.slug}`);
      }
      return getForm(api, match.id);
    },
  },

  list_submissions: {
    description: 'List submissions for a specific form',
    inputSchema: z.object({
      formId: z.string().min(1).describe('Form ID'),
      status: submissionStatusSchema.optional().describe('Filter by submission status'),
      limit: z.number().int().positive().optional().describe('Maximum number of results (default: 50)'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
    }),
    handler: async (
      api: ReversoApiClient,
      input: { formId: string; status?: SubmissionStatus; limit?: number; offset?: number }
    ) => {
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      const { data, meta } = await api.get<SubmissionSummary[]>(`${formPath(input.formId)}/submissions`, {
        limit,
        offset,
      });
      const submissions = input.status ? data.filter((s) => s.status === input.status) : data;
      const stats = (meta ?? {}) as Partial<SubmissionsMeta>;
      return { submissions, total: stats.total ?? data.length, offset, limit };
    },
  },

  get_submission: {
    description: 'Get a specific form submission by ID',
    inputSchema: z.object({
      formId: z.string().min(1).describe('Form ID the submission belongs to'),
      id: z.string().min(1).describe('Submission ID'),
    }),
    handler: async (api: ReversoApiClient, input: { formId: string; id: string }) => {
      const { data } = await api.get<SubmissionDetail>(
        `${formPath(input.formId)}/submissions/${encodeURIComponent(input.id)}`
      );
      return data;
    },
  },

  update_submission_status: {
    description: 'Update the status of a form submission',
    inputSchema: z.object({
      formId: z.string().min(1).describe('Form ID the submission belongs to'),
      id: z.string().min(1).describe('Submission ID'),
      status: submissionStatusSchema.describe('New status'),
    }),
    handler: async (api: ReversoApiClient, input: { formId: string; id: string; status: SubmissionStatus }) => {
      const { data } = await api.put<{ id: string; status: SubmissionStatus }>(
        `${formPath(input.formId)}/submissions/${encodeURIComponent(input.id)}/status`,
        { status: input.status }
      );
      return data;
    },
  },

  get_form_stats: {
    description: 'Get statistics for a specific form',
    inputSchema: z.object({
      formId: z.string().min(1).describe('Form ID'),
    }),
    handler: async (api: ReversoApiClient, input: { formId: string }) => {
      const form = await getForm(api, input.formId);
      const stats = form.submissionStats ?? { total: 0 };
      return {
        form: { id: form.id, name: form.name, slug: form.slug, status: form.status },
        totalSubmissions: stats.total ?? 0,
        byStatus: {
          new: stats.new ?? 0,
          read: stats.read ?? 0,
          spam: stats.spam ?? 0,
        },
        fieldCount: form.fields?.length ?? 0,
      };
    },
  },
};
