import type { FileValue, ImageValue } from '@reverso/core';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MediaFilters {
  search?: string;
  mimeType?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch media library items with pagination
 */
export function useMedia(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: ['media', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.mimeType) params.set('mimeType', filters.mimeType);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

      const url = `${endpoints.media.list()}${params.toString() ? `?${params}` : ''}`;
      const response = await apiClient.get<MediaListResponse>(url);
      return response.data;
    },
  });
}

/**
 * Infinite query for media library
 */
export function useInfiniteMedia(filters: Omit<MediaFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['media', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.mimeType) params.set('mimeType', filters.mimeType);
      params.set('page', String(pageParam));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

      const url = `${endpoints.media.list()}?${params}`;
      const response = await apiClient.get<MediaListResponse>(url);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
}

/**
 * Fetch a single media item
 */
export function useMediaItem(id: string) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      const response = await apiClient.get<MediaItem>(endpoints.media.get(id));
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Upload media files
 */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      const response = await apiClient.upload<MediaItem[]>(endpoints.media.upload(), formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

/**
 * Update media item metadata
 */
export function useUpdateMedia(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MediaItem>) => {
      const response = await apiClient.patch<MediaItem>(endpoints.media.get(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['media', id] });
    },
  });
}

/**
 * Delete a media item
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(endpoints.media.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

/**
 * Bulk delete media items
 */
export function useBulkDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await apiClient.post(endpoints.media.bulk(), { action: 'delete', ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

/**
 * Convert MediaItem to ImageValue for field storage
 */
export function mediaToImageValue(media: MediaItem): ImageValue {
  return {
    url: media.url,
    alt: media.alt,
    width: media.width,
    height: media.height,
    filename: media.filename,
    size: media.size,
    mimeType: media.mimeType,
  };
}

/**
 * Convert MediaItem to FileValue for field storage
 */
export function mediaToFileValue(media: MediaItem): FileValue {
  return {
    url: media.url,
    filename: media.filename,
    size: media.size,
    mimeType: media.mimeType,
  };
}
