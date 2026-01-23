import type { ContentValue, PageContent } from '@reverso/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

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
 * Update content for a page or specific path
 */
export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageSlug, path, data }: UpdateContentParams) => {
      const response = await apiClient.patch<PageContent>(
        endpoints.content.update(pageSlug, path),
        { data }
      );
      return response.data;
    },
    onSuccess: (_, { pageSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['content', pageSlug] });
    },
  });
}

/**
 * Batch update multiple fields
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
      const response = await apiClient.patch<PageContent>(endpoints.content.update(pageSlug), {
        data: updates,
      });
      return response.data;
    },
    onSuccess: (_, { pageSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['content', pageSlug] });
    },
  });
}
