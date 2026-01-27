/**
 * Forms tools for the MCP server.
 */

import type { DrizzleDatabase } from '@reverso/db';
import {
  getForms,
  getFormById,
  getFormBySlug,
  getFormFields,
  getFormSubmissions,
  getFormSubmissionById,
  updateFormSubmissionStatus,
  type Form,
  type FormSubmission,
} from '@reverso/db';
import { z } from 'zod';

export const formsTools = {
  list_forms: {
    description: 'List all forms in the CMS',
    inputSchema: z.object({
      status: z.enum(['draft', 'published', 'archived']).optional().describe('Filter by form status'),
      includeFields: z.boolean().optional().describe('Include form fields in response'),
    }),
    handler: async (
      db: DrizzleDatabase,
      input: { status?: string; includeFields?: boolean }
    ) => {
      let forms = await getForms(db);

      if (input.status) {
        forms = forms.filter((f: Form) => f.status === input.status);
      }

      if (input.includeFields) {
        const formsWithFields = await Promise.all(
          forms.map(async (form: Form) => {
            const fields = await getFormFields(db, form.id);
            return { ...form, fields };
          })
        );
        return { forms: formsWithFields, total: formsWithFields.length };
      }

      return { forms, total: forms.length };
    },
  },

  get_form: {
    description: 'Get a specific form by ID or slug with all its fields',
    inputSchema: z.object({
      id: z.string().optional().describe('Form ID'),
      slug: z.string().optional().describe('Form slug'),
    }),
    handler: async (db: DrizzleDatabase, input: { id?: string; slug?: string }) => {
      if (!input.id && !input.slug) {
        throw new Error('Either id or slug must be provided');
      }

      let form: Form | null | undefined = null;
      if (input.id) {
        form = await getFormById(db, input.id);
      } else if (input.slug) {
        form = await getFormBySlug(db, input.slug);
      }

      if (!form) {
        throw new Error(`Form not found: ${input.id ?? input.slug}`);
      }

      const fields = await getFormFields(db, form.id);
      return { ...form, fields };
    },
  },

  list_submissions: {
    description: 'List submissions for a specific form',
    inputSchema: z.object({
      formId: z.string().describe('Form ID'),
      status: z.enum(['new', 'read', 'spam', 'archived']).optional().describe('Filter by submission status'),
      limit: z.number().optional().describe('Maximum number of results'),
      offset: z.number().optional().describe('Offset for pagination'),
    }),
    handler: async (
      db: DrizzleDatabase,
      input: { formId: string; status?: string; limit?: number; offset?: number }
    ) => {
      let submissions = await getFormSubmissions(db, { formId: input.formId });

      if (input.status) {
        submissions = submissions.filter((s: FormSubmission) => s.status === input.status);
      }

      const total = submissions.length;
      const offset = input.offset ?? 0;
      const limit = input.limit ?? 50;

      submissions = submissions.slice(offset, offset + limit);

      return { submissions, total, offset, limit };
    },
  },

  get_submission: {
    description: 'Get a specific form submission by ID',
    inputSchema: z.object({
      id: z.string().describe('Submission ID'),
    }),
    handler: async (db: DrizzleDatabase, input: { id: string }) => {
      const submission = await getFormSubmissionById(db, input.id);
      if (!submission) {
        throw new Error(`Submission not found: ${input.id}`);
      }
      return submission;
    },
  },

  update_submission_status: {
    description: 'Update the status of a form submission',
    inputSchema: z.object({
      id: z.string().describe('Submission ID'),
      status: z.enum(['new', 'read', 'spam', 'archived']).describe('New status'),
    }),
    handler: async (db: DrizzleDatabase, input: { id: string; status: 'new' | 'read' | 'spam' | 'archived' }) => {
      const submission = await updateFormSubmissionStatus(db, input.id, input.status);
      if (!submission) {
        throw new Error(`Submission not found: ${input.id}`);
      }
      return submission;
    },
  },

  get_form_stats: {
    description: 'Get statistics for a specific form',
    inputSchema: z.object({
      formId: z.string().describe('Form ID'),
    }),
    handler: async (db: DrizzleDatabase, input: { formId: string }) => {
      const form = await getFormById(db, input.formId);
      if (!form) {
        throw new Error(`Form not found: ${input.formId}`);
      }

      const submissions = await getFormSubmissions(db, { formId: input.formId });
      const fields = await getFormFields(db, input.formId);

      const byStatus = submissions.reduce(
        (acc: Record<string, number>, s: FormSubmission) => {
          acc[s.status] = (acc[s.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get submissions per day (last 30 days)
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const recentSubmissions = submissions.filter((s: FormSubmission) => {
        const createdAt = new Date(s.createdAt).getTime();
        return createdAt >= thirtyDaysAgo;
      });

      return {
        form: { id: form.id, name: form.name, slug: form.slug, status: form.status },
        totalSubmissions: submissions.length,
        byStatus,
        recentSubmissions: recentSubmissions.length,
        fieldCount: fields.length,
      };
    },
  },
};
