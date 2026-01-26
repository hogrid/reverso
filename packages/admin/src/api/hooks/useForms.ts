import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// Types
export interface FormListItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  isMultiStep?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  validation?: string;
  config?: {
    options?: Array<{ label: string; value: string }>;
    accept?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    rows?: number;
    multiple?: boolean;
  };
  width?: number;
  step?: number;
  sortOrder?: number;
}

export interface FormDetail extends FormListItem {
  steps?: Array<{ id: string; name: string; description?: string }>;
  settings?: {
    submitButtonText?: string;
    successMessage?: string;
    redirectUrl?: string;
  };
  notifyEmails?: string[];
  notifyOnSubmission?: boolean;
  webhookUrl?: string;
  webhookEnabled?: boolean;
  honeypotEnabled?: boolean;
  rateLimitPerMinute?: number;
  fields: FormField[];
  submissionStats: {
    total: number;
    new: number;
    read: number;
    spam: number;
    archived: number;
  };
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  status: 'new' | 'read' | 'spam' | 'archived';
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  attachments?: string[];
  webhookSentAt?: string;
  createdAt: string;
}

export interface CreateFormInput {
  name: string;
  slug: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  isMultiStep?: boolean;
  steps?: Array<{ id: string; name: string; description?: string }>;
  settings?: {
    submitButtonText?: string;
    successMessage?: string;
    redirectUrl?: string;
  };
  notifyEmails?: string[];
  notifyOnSubmission?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled?: boolean;
  honeypotEnabled?: boolean;
  rateLimitPerMinute?: number;
}

export interface CreateFormFieldInput {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  validation?: string;
  config?: FormField['config'];
  width?: number;
  step?: number;
  sortOrder?: number;
}

// Query hooks

/**
 * Fetch list of all forms
 */
export function useForms() {
  return useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const response = await apiClient.get<FormListItem[]>(endpoints.forms.list());
      return response.data;
    },
  });
}

/**
 * Fetch a single form with fields
 */
export function useForm(id: string) {
  return useQuery({
    queryKey: ['forms', id],
    queryFn: async () => {
      const response = await apiClient.get<FormDetail>(endpoints.forms.get(id));
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch submissions for a form
 */
export function useFormSubmissions(formId: string, options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['forms', formId, 'submissions', options],
    queryFn: async () => {
      let url = endpoints.forms.submissions(formId);
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiClient.get<FormSubmission[]>(url);
      return response;
    },
    enabled: !!formId,
  });
}

/**
 * Fetch a single submission
 */
export function useFormSubmission(formId: string, submissionId: string) {
  return useQuery({
    queryKey: ['forms', formId, 'submissions', submissionId],
    queryFn: async () => {
      const response = await apiClient.get<FormSubmission>(
        endpoints.forms.submission(formId, submissionId)
      );
      return response.data;
    },
    enabled: !!formId && !!submissionId,
  });
}

// Mutation hooks

/**
 * Create a new form
 */
export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFormInput) => {
      const response = await apiClient.post<FormListItem>(endpoints.forms.create(), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

/**
 * Update a form
 */
export function useUpdateForm(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateFormInput>) => {
      const response = await apiClient.put<FormListItem>(endpoints.forms.update(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', id] });
    },
  });
}

/**
 * Delete a form
 */
export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(endpoints.forms.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

/**
 * Duplicate a form
 */
export function useDuplicateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, slug }: { id: string; slug: string }) => {
      const response = await apiClient.post<FormListItem>(endpoints.forms.duplicate(id), { slug });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

/**
 * Publish a form
 */
export function usePublishForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put<{ id: string; status: string }>(
        endpoints.forms.publish(id)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', id] });
    },
  });
}

/**
 * Unpublish a form
 */
export function useUnpublishForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put<{ id: string; status: string }>(
        endpoints.forms.unpublish(id)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', id] });
    },
  });
}

// Field mutations

/**
 * Add a field to a form
 */
export function useAddFormField(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFormFieldInput) => {
      const response = await apiClient.post<FormField>(endpoints.forms.addField(formId), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}

/**
 * Update a form field
 */
export function useUpdateFormField(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: string; data: Partial<CreateFormFieldInput> }) => {
      const response = await apiClient.put<FormField>(
        endpoints.forms.updateField(formId, fieldId),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}

/**
 * Delete a form field
 */
export function useDeleteFormField(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      await apiClient.delete(endpoints.forms.deleteField(formId, fieldId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}

/**
 * Reorder form fields
 */
export function useReorderFormFields(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldIds: string[]) => {
      await apiClient.put(endpoints.forms.reorderFields(formId), { fieldIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}

// Submission mutations

/**
 * Update submission status
 */
export function useUpdateSubmissionStatus(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      status,
    }: {
      submissionId: string;
      status: 'new' | 'read' | 'spam' | 'archived';
    }) => {
      const response = await apiClient.put<{ id: string; status: string }>(
        endpoints.forms.submissionStatus(formId, submissionId),
        { status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId, 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}

/**
 * Delete a submission
 */
export function useDeleteSubmission(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      await apiClient.delete(endpoints.forms.submission(formId, submissionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId, 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}
