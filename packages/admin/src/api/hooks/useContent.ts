import type { ContentValue, PageContent } from '@reverso/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { API_BASE, endpoints } from '../endpoints';

/**
 * Fetch content for a page
 */
export function useContent(pageSlug: string) {
  return useQuery({
    queryKey: ['content', pageSlug],
    queryFn: async () => {
      const response = await apiClient.get<PageContent>(endpoints.content.get(pageSlug));
      return response.data;
    },
    enabled: !!pageSlug,
  });
}

/**
 * Fetch content for a specific path
 */
export function useFieldContent(pageSlug: string, path: string) {
  return useQuery({
    queryKey: ['content', pageSlug, path],
    queryFn: async () => {
      const response = await apiClient.get<ContentValue>(endpoints.content.get(pageSlug, path));
      return response.data;
    },
    enabled: !!pageSlug && !!path,
  });
}

export interface UpdateContentParams {
  pageSlug: string;
  path?: string;
  data: Record<string, ContentValue> | ContentValue;
}

/**
 * Update content for a page or specific path.
 * Single field: PUT /content/:path
 * Page bulk: PATCH /content/page/:slug
 */
export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageSlug, path, data }: UpdateContentParams) => {
      if (path) {
        // Single field update via PUT
        const response = await apiClient.put<PageContent>(
          endpoints.content.update(pageSlug, path),
          { value: data }
        );
        return response.data;
      }
      // Page-level bulk update via PATCH
      const response = await apiClient.patch<PageContent & { updated?: number }>(
        endpoints.content.update(pageSlug),
        { data }
      );
      // The API silently skips paths that no longer exist in the schema
      // (stale admin tab after markers changed). Never let that pass as a
      // successful save.
      const sent = data ? Object.keys(data).length : 0;
      const updated = response.data?.updated;
      if (typeof updated === 'number' && updated < sent) {
        throw new Error(
          `${sent - updated} of ${sent} field(s) were not saved because they are no longer in the schema. Reload the page and try again.`
        );
      }
      return response.data;
    },
    onSuccess: (_, { pageSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['content', pageSlug] });
    },
  });
}

/**
 * Batch update multiple fields for a page.
 * Uses POST /content/bulk
 */
export function useBatchUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageSlug,
      updates,
    }: {
      pageSlug: string;
      updates: Record<string, ContentValue>;
    }) => {
      const bulkUpdates = Object.entries(updates).map(([path, value]) => ({
        path,
        value,
      }));
      const response = await apiClient.post<PageContent>(
        `${API_BASE}/content/bulk`,
        { updates: bulkUpdates }
      );
      return response.data;
    },
    onSuccess: (_, { pageSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['content', pageSlug] });
    },
  });
}
