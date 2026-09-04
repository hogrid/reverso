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
  return useQuery<MediaListResponse>({
    queryKey: ['media', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.mimeType) params.set('type', filters.mimeType);
      const pageSize = filters.pageSize || 20;
      const page = filters.page || 1;
      params.set('limit', String(pageSize));
      params.set('offset', String((page - 1) * pageSize));

      const url = `${endpoints.media.list()}${params.toString() ? `?${params}` : ''}`;
      // The API answers { data: MediaItem[], meta: { total, limit, offset } };
      // expose it in the paginated shape the pages and pickers render.
      const response = (await apiClient.get<MediaItem[]>(url)) as {
        data: MediaItem[];
        meta?: { total?: number; limit?: number; offset?: number };
      };
      const items = response.data ?? [];
      const total = response.meta?.total ?? items.length;
      return {
        items,
        total,
        page,
        pageSize,
        hasMore: (page - 1) * pageSize + items.length < total,
      };
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
      if (filters.mimeType) params.set('type', filters.mimeType);
      const pageSize = filters.pageSize || 20;
      params.set('limit', String(pageSize));
      params.set('offset', String(((pageParam as number) - 1) * pageSize));

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
    mutationFn: async (files: File[]): Promise<MediaItem[]> => {
      // POST /media accepts one file per request; upload sequentially so
      // multi-file drops (gallery) work and each failure is attributable.
      const uploaded: MediaItem[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.upload<MediaItem>(endpoints.media.upload(), formData);
        if (response.data) uploaded.push(response.data);
      }
      return uploaded;
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
