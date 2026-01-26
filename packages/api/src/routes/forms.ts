/**
 * Forms routes.
 * Handles forms, form fields, and form submissions CRUD operations.
 */

import {
  createForm,
  createFormField,
  createFormSubmission,
  deleteForm,
  deleteFormField,
  deleteFormSubmission,
  duplicateForm,
  duplicateFormFields,
  getFormById,
  getFormBySlug,
  getFormFields,
  getFormSubmissionById,
  getFormSubmissionStats,
  getFormSubmissions,
  getFormSubmissionsByFormId,
  getForms,
  parseFormFieldConfig,
  parseFormSettings,
  parseFormSteps,
  parseNotifyEmails,
  parseSubmissionAttachments,
  parseSubmissionData,
  publishForm,
  recordWebhookSent,
  reorderFormFields,
  unpublishForm,
  updateForm,
  updateFormField,
  updateFormSubmissionStatus,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  formCreateSchema,
  formFieldCreateSchema,
  formFieldUpdateSchema,
  formSubmissionCreateSchema,
  formUpdateSchema,
  idParamSchema,
  paginationSchema,
  slugParamSchema,
} from '../validation.js';

const formsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ============================================
  // FORM CRUD
  // ============================================

  /**
   * GET /forms
   * List all forms.
   */
  fastify.get('/forms', async (request, reply) => {
    try {
      const db = request.db;
      const forms = await getForms(db);

      return {
        success: true,
        data: forms.map((form) => ({
          id: form.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          status: form.status,
          isMultiStep: form.isMultiStep,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        })),
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to list forms');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to list forms',
      });
    }
  });

  /**
   * POST /forms
   * Create a new form.
   */
  fastify.post('/forms', async (request, reply) => {
    try {
      const bodyResult = formCreateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const db = request.db;
      const input = bodyResult.data;

      // Check if slug already exists
      const existing = await getFormBySlug(db, input.slug);
      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: `Form with slug "${input.slug}" already exists`,
        });
      }

      const form = await createForm(db, input);

      return {
        success: true,
        data: {
          id: form.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          status: form.status,
          createdAt: form.createdAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to create form');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to create form',
      });
    }
  });

  /**
   * GET /forms/:id
   * Get form by ID with fields.
   */
  fastify.get<{ Params: { id: string } }>('/forms/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const form = await getFormById(db, id);
      if (!form) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Form with ID "${id}" not found`,
        });
      }

      const fields = await getFormFields(db, id);
      const stats = await getFormSubmissionStats(db, id);

      return {
        success: true,
        data: {
          id: form.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          status: form.status,
          isMultiStep: form.isMultiStep,
          steps: parseFormSteps(form),
          settings: parseFormSettings(form),
          notifyEmails: parseNotifyEmails(form),
          notifyOnSubmission: form.notifyOnSubmission,
          webhookUrl: form.webhookUrl,
          webhookEnabled: form.webhookEnabled,
          honeypotEnabled: form.honeypotEnabled,
          rateLimitPerMinute: form.rateLimitPerMinute,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
          fields: fields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            help: field.help,
            required: field.required,
            validation: field.validation,
            config: parseFormFieldConfig(field),
            width: field.width,
            step: field.step,
            sortOrder: field.sortOrder,
          })),
          submissionStats: stats,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get form');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get form',
      });
    }
  });

  /**
   * PUT /forms/:id
   * Update a form.
   */
  fastify.put<{ Params: { id: string } }>('/forms/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const bodyResult = formUpdateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const form = await updateForm(db, id, bodyResult.data);
      if (!form) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Form with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: form.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          status: form.status,
          updatedAt: form.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to update form');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to update form',
      });
    }
  });

  /**
   * DELETE /forms/:id
   * Delete a form.
   */
  fastify.delete<{ Params: { id: string } }>('/forms/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const form = await deleteForm(db, id);
      if (!form) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Form with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: { id: form.id, deleted: true },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to delete form');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to delete form',
      });
    }
  });

  /**
   * POST /forms/:id/duplicate
   * Duplicate a form.
   */
  fastify.post<{ Params: { id: string }; Body: { slug: string } }>(
    '/forms/:id/duplicate',
    async (request, reply) => {
      try {
        const paramResult = idParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid ID format',
          });
        }

        const bodyResult = slugParamSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid slug format',
          });
        }

        const db = request.db;
        const { id } = paramResult.data;
        const { slug } = bodyResult.data;

        // Check if new slug already exists
        const existingSlug = await getFormBySlug(db, slug);
        if (existingSlug) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: `Form with slug "${slug}" already exists`,
          });
        }

        const newForm = await duplicateForm(db, id, slug);
        if (!newForm) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Form with ID "${id}" not found`,
          });
        }

        // Duplicate fields
        await duplicateFormFields(db, id, newForm.id);

        return {
          success: true,
          data: {
            id: newForm.id,
            name: newForm.name,
            slug: newForm.slug,
            status: newForm.status,
            createdAt: newForm.createdAt,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to duplicate form');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to duplicate form',
        });
      }
    }
  );

  /**
   * PUT /forms/:id/publish
   * Publish a form.
   */
  fastify.put<{ Params: { id: string } }>('/forms/:id/publish', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const form = await publishForm(db, id);
      if (!form) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Form with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: form.id,
          status: form.status,
          updatedAt: form.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to publish form');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to publish form',
      });
    }
  });

  /**
   * PUT /forms/:id/unpublish
   * Unpublish a form.
   */
  fastify.put<{ Params: { id: string } }>('/forms/:id/unpublish', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const form = await unpublishForm(db, id);
      if (!form) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Form with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: form.id,
          status: form.status,
          updatedAt: form.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to unpublish form');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to unpublish form',
      });
    }
  });

  // ============================================
  // FORM FIELDS
  // ============================================

  /**
   * POST /forms/:id/fields
   * Add a field to a form.
   */
  fastify.post<{ Params: { id: string } }>('/forms/:id/fields', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const bodyResult = formFieldCreateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      // Check form exists
      const form = await getFormById(db, id);
      if (!form) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Form with ID "${id}" not found`,
        });
      }

      const field = await createFormField(db, {
        formId: id,
        ...bodyResult.data,
      });

      return {
        success: true,
        data: {
          id: field.id,
          name: field.name,
          type: field.type,
          label: field.label,
          sortOrder: field.sortOrder,
          createdAt: field.createdAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to add form field');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to add form field',
      });
    }
  });

  /**
   * PUT /forms/:id/fields/:fieldId
   * Update a form field.
   */
  fastify.put<{ Params: { id: string; fieldId: string } }>(
    '/forms/:id/fields/:fieldId',
    async (request, reply) => {
      try {
        const paramResult = idParamSchema.safeParse({ id: request.params.fieldId });
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid field ID format',
          });
        }

        const bodyResult = formFieldUpdateSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
          });
        }

        const db = request.db;
        const { id: fieldId } = paramResult.data;

        const field = await updateFormField(db, fieldId, bodyResult.data);
        if (!field) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Field with ID "${fieldId}" not found`,
          });
        }

        return {
          success: true,
          data: {
            id: field.id,
            name: field.name,
            type: field.type,
            updatedAt: field.updatedAt,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to update form field');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to update form field',
        });
      }
    }
  );

  /**
   * DELETE /forms/:id/fields/:fieldId
   * Delete a form field.
   */
  fastify.delete<{ Params: { id: string; fieldId: string } }>(
    '/forms/:id/fields/:fieldId',
    async (request, reply) => {
      try {
        const db = request.db;
        const { fieldId } = request.params;

        const field = await deleteFormField(db, fieldId);
        if (!field) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Field with ID "${fieldId}" not found`,
          });
        }

        return {
          success: true,
          data: { id: field.id, deleted: true },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to delete form field');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to delete form field',
        });
      }
    }
  );

  /**
   * PUT /forms/:id/fields/reorder
   * Reorder form fields.
   */
  fastify.put<{ Params: { id: string }; Body: { fieldIds: string[] } }>(
    '/forms/:id/fields/reorder',
    async (request, reply) => {
      try {
        const paramResult = idParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid ID format',
          });
        }

        const { fieldIds } = request.body as { fieldIds: string[] };
        if (!Array.isArray(fieldIds)) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'fieldIds must be an array',
          });
        }

        const db = request.db;
        const { id } = paramResult.data;

        await reorderFormFields(db, id, fieldIds);

        return {
          success: true,
          data: { reordered: true },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to reorder form fields');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to reorder form fields',
        });
      }
    }
  );

  // ============================================
  // FORM SUBMISSIONS
  // ============================================

  /**
   * GET /forms/:id/submissions
   * List submissions for a form.
   */
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>(
    '/forms/:id/submissions',
    async (request, reply) => {
      try {
        const paramResult = idParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid ID format',
          });
        }

        const queryResult = paginationSchema.safeParse(request.query);
        const { limit, offset } = queryResult.success ? queryResult.data : {};

        const db = request.db;
        const { id } = paramResult.data;

        const submissions = await getFormSubmissionsByFormId(db, id, { limit, offset });
        const stats = await getFormSubmissionStats(db, id);

        return {
          success: true,
          data: submissions.map((sub) => ({
            id: sub.id,
            data: parseSubmissionData(sub),
            status: sub.status,
            ipAddress: sub.ipAddress,
            referrer: sub.referrer,
            createdAt: sub.createdAt,
          })),
          meta: {
            total: stats.total,
            new: stats.new,
            read: stats.read,
            spam: stats.spam,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to list submissions');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to list submissions',
        });
      }
    }
  );

  /**
   * GET /forms/:id/submissions/:subId
   * Get a specific submission.
   */
  fastify.get<{ Params: { id: string; subId: string } }>(
    '/forms/:id/submissions/:subId',
    async (request, reply) => {
      try {
        const db = request.db;
        const { subId } = request.params;

        const submission = await getFormSubmissionById(db, subId);
        if (!submission) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Submission with ID "${subId}" not found`,
          });
        }

        return {
          success: true,
          data: {
            id: submission.id,
            formId: submission.formId,
            data: parseSubmissionData(submission),
            status: submission.status,
            ipAddress: submission.ipAddress,
            userAgent: submission.userAgent,
            referrer: submission.referrer,
            attachments: parseSubmissionAttachments(submission),
            webhookSentAt: submission.webhookSentAt,
            createdAt: submission.createdAt,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to get submission');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to get submission',
        });
      }
    }
  );

  /**
   * PUT /forms/:id/submissions/:subId/status
   * Update submission status.
   */
  fastify.put<{ Params: { id: string; subId: string }; Body: { status: string } }>(
    '/forms/:id/submissions/:subId/status',
    async (request, reply) => {
      try {
        const db = request.db;
        const { subId } = request.params;
        const { status } = request.body as { status: 'new' | 'read' | 'spam' | 'archived' };

        if (!['new', 'read', 'spam', 'archived'].includes(status)) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid status. Must be one of: new, read, spam, archived',
          });
        }

        const submission = await updateFormSubmissionStatus(db, subId, status);
        if (!submission) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Submission with ID "${subId}" not found`,
          });
        }

        return {
          success: true,
          data: {
            id: submission.id,
            status: submission.status,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to update submission status');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to update submission status',
        });
      }
    }
  );

  /**
   * DELETE /forms/:id/submissions/:subId
   * Delete a submission.
   */
  fastify.delete<{ Params: { id: string; subId: string } }>(
    '/forms/:id/submissions/:subId',
    async (request, reply) => {
      try {
        const db = request.db;
        const { subId } = request.params;

        const submission = await deleteFormSubmission(db, subId);
        if (!submission) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Submission with ID "${subId}" not found`,
          });
        }

        return {
          success: true,
          data: { id: submission.id, deleted: true },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to delete submission');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to delete submission',
        });
      }
    }
  );

  /**
   * POST /forms/:id/submissions/export
   * Export submissions as CSV.
   */
  fastify.post<{ Params: { id: string } }>(
    '/forms/:id/submissions/export',
    async (request, reply) => {
      try {
        const paramResult = idParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid ID format',
          });
        }

        const db = request.db;
        const { id } = paramResult.data;

        const form = await getFormById(db, id);
        if (!form) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Form with ID "${id}" not found`,
          });
        }

        const fields = await getFormFields(db, id);
        const submissions = await getFormSubmissionsByFormId(db, id, { limit: 10000 });

        // Build CSV
        const headers = ['ID', 'Status', 'IP', 'Created At', ...fields.map((f) => f.label || f.name)];
        const rows = submissions.map((sub) => {
          const data = parseSubmissionData(sub);
          return [
            sub.id,
            sub.status,
            sub.ipAddress ?? '',
            sub.createdAt?.toISOString() ?? '',
            ...fields.map((f) => String(data[f.name] ?? '')),
          ];
        });

        const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n');

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${form.slug}-submissions.csv"`);
        return csv;
      } catch (error) {
        fastify.log.error(error, 'Failed to export submissions');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to export submissions',
        });
      }
    }
  );

  // ============================================
  // PUBLIC FORM SUBMISSION
  // ============================================

  /**
   * POST /public/forms/:slug/submit
   * Public form submission endpoint (no auth required).
   */
  fastify.post<{ Params: { slug: string } }>(
    '/public/forms/:slug/submit',
    async (request, reply) => {
      try {
        const paramResult = slugParamSchema.safeParse(request.params);
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid slug format',
          });
        }

        const bodyResult = formSubmissionCreateSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
          });
        }

        const db = request.db;
        const { slug } = paramResult.data;
        const { data, honeypot } = bodyResult.data;

        const form = await getFormBySlug(db, slug);
        if (!form || form.status !== 'published') {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: 'Form not found or not published',
          });
        }

        // Check honeypot
        if (form.honeypotEnabled && honeypot) {
          // Silently accept but mark as spam
          const submission = await createFormSubmission(db, {
            formId: form.id,
            data,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            referrer: request.headers.referer,
          });
          await updateFormSubmissionStatus(db, submission.id, 'spam');

          return {
            success: true,
            data: { id: submission.id },
          };
        }

        // Create submission
        const submission = await createFormSubmission(db, {
          formId: form.id,
          data,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          referrer: request.headers.referer,
        });

        // Send webhook if enabled
        if (form.webhookEnabled && form.webhookUrl) {
          try {
            const webhookResponse = await fetch(form.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(form.webhookSecret && { 'X-Webhook-Secret': form.webhookSecret }),
              },
              body: JSON.stringify({
                formId: form.id,
                formSlug: form.slug,
                submissionId: submission.id,
                data,
                submittedAt: submission.createdAt,
              }),
            });

            await recordWebhookSent(db, submission.id, {
              status: webhookResponse.status,
              ok: webhookResponse.ok,
            });
          } catch (webhookError) {
            fastify.log.error(webhookError, 'Failed to send webhook');
          }
        }

        const settings = parseFormSettings(form);

        return {
          success: true,
          data: {
            id: submission.id,
            message: settings.successMessage ?? 'Form submitted successfully',
            redirectUrl: settings.redirectUrl,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to submit form');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to submit form',
        });
      }
    }
  );
};

/**
 * Escape a value for CSV.
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default formsRoutes;
