import type { PageSchema, ProjectSchema } from '@reverso/core';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

/**
 * Fetch the complete project schema
 */
export function useSchema() {
  return useQuery({
    queryKey: ['schema'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectSchema>(endpoints.schema.get());
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch schema for a specific page
 */
export function usePageSchema(slug: string) {
  return useQuery({
    queryKey: ['schema', 'page', slug],
    queryFn: async () => {
      const response = await apiClient.get<PageSchema>(endpoints.schema.page(slug));
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
