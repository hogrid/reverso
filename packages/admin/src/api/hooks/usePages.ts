import type { PageSchema } from '@reverso/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export interface PageListItem {
  slug: string;
  name: string;
  sectionCount: number;
  fieldCount: number;
  updatedAt?: string;
}

/**
 * Fetch list of all pages
 */
export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const response = await apiClient.get<PageListItem[]>(endpoints.pages.list());
      return response.data;
    },
  });
}

/**
 * Fetch a single page with its schema
 */
export function usePage(slug: string) {
  return useQuery({
    queryKey: ['pages', slug],
    queryFn: async () => {
      const response = await apiClient.get<PageSchema>(endpoints.pages.get(slug));
      return response.data;
    },
    enabled: !!slug,
  });
}

/**
 * Create a new page
 */
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { slug: string; name: string }) => {
      const response = await apiClient.post<PageSchema>(endpoints.pages.create(), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['schema'] });
    },
  });
}

/**
 * Update a page
 */
export function useUpdatePage(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PageSchema>) => {
      const response = await apiClient.put<PageSchema>(endpoints.pages.update(slug), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['pages', slug] });
      queryClient.invalidateQueries({ queryKey: ['schema'] });
    },
  });
}

/**
 * Delete a page
 */
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      await apiClient.delete(endpoints.pages.delete(slug));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['schema'] });
    },
  });
}
