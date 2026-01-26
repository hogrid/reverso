import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

// Types
export interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302 | 307 | 308;
  isEnabled: boolean;
  hitCount: number;
  lastHitAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectsListResponse {
  data: Redirect[];
  meta: {
    total: number;
    enabled: number;
    disabled: number;
    totalHits: number;
  };
}

export interface CreateRedirectInput {
  fromPath: string;
  toPath: string;
  statusCode?: 301 | 302 | 307 | 308;
  isEnabled?: boolean;
}

// Query hooks

/**
 * Fetch list of all redirects
 */
export function useRedirects(options?: { enabled?: boolean; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['redirects', options],
    queryFn: async () => {
      let url = endpoints.redirects.list();
      const params = new URLSearchParams();
      if (options?.enabled !== undefined) params.set('enabled', String(options.enabled));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiClient.get<Redirect[]>(url);
      return response;
    },
  });
}

/**
 * Fetch a single redirect
 */
export function useRedirect(id: string) {
  return useQuery({
    queryKey: ['redirects', id],
    queryFn: async () => {
      const response = await apiClient.get<Redirect>(endpoints.redirects.get(id));
      return response.data;
    },
    enabled: !!id,
  });
}

// Mutation hooks

/**
 * Create a new redirect
 */
export function useCreateRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRedirectInput) => {
      const response = await apiClient.post<Redirect>(endpoints.redirects.create(), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
    },
  });
}

/**
 * Update a redirect
 */
export function useUpdateRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRedirectInput> }) => {
      const response = await apiClient.put<Redirect>(endpoints.redirects.update(id), data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
      queryClient.invalidateQueries({ queryKey: ['redirects', id] });
    },
  });
}

/**
 * Delete a redirect
 */
export function useDeleteRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(endpoints.redirects.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
    },
  });
}

/**
 * Enable a redirect
 */
export function useEnableRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put<{ id: string; isEnabled: boolean }>(
        endpoints.redirects.enable(id)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
      queryClient.invalidateQueries({ queryKey: ['redirects', id] });
    },
  });
}

/**
 * Disable a redirect
 */
export function useDisableRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put<{ id: string; isEnabled: boolean }>(
        endpoints.redirects.disable(id)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
      queryClient.invalidateQueries({ queryKey: ['redirects', id] });
    },
  });
}

/**
 * Bulk import redirects
 */
export function useBulkImportRedirects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      redirects: Array<{ fromPath: string; toPath: string; statusCode?: number }>
    ) => {
      const response = await apiClient.post<{
        created: number;
        skipped: number;
        errors: string[];
      }>(endpoints.redirects.bulkImport(), { redirects });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] });
    },
  });
}
