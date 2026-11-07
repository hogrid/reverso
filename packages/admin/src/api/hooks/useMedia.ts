import type { FileValue, ImageValue } from '@reverso/core';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  /** Name the file had when uploaded; what editors and visitors expect to see. */
  originalName?: string | null;
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

/** One page of GET /media as the API returns it. */
interface MediaPageResponse {
  data?: MediaItem[];
  meta?: { total?: number; limit?: number; offset?: number };
}

interface MediaPage {
  items: MediaItem[];
  total: number;
  offset: number;
}

/**
 * Infinite media query: fetches subsequent offsets ("Load more") until the
 * server-reported total is reached. Exposes the flattened `items` and `total`.
 * Keeps the previous results visible while a new search loads, so the search
 * box is never unmounted mid-typing.
 */
export function useInfiniteMedia(filters: Omit<MediaFilters, 'page'> = {}) {
  const pageSize = filters.pageSize || 20;
  const query = useInfiniteQuery({
    queryKey: ['media', 'infinite', { ...filters, pageSize }],
    queryFn: async ({ pageParam }): Promise<MediaPage> => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.mimeType) params.set('type', filters.mimeType);
      params.set('limit', String(pageSize));
      params.set('offset', String(pageParam));

      const response = (await apiClient.get<MediaItem[]>(
        `${endpoints.media.list()}?${params}`
      )) as MediaPageResponse;
      const items = response.data ?? [];
      return { items, total: response.meta?.total ?? pageParam + items.length, offset: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.items.length;
      // Stop on an empty page too, so a shrinking library can't loop forever.
      return lastPage.items.length > 0 && next < lastPage.total ? next : undefined;
    },
    placeholderData: keepPreviousData,
  });

  const pages = query.data?.pages ?? [];
  const items = pages.flatMap((page) => page.items);
  const total = pages.at(-1)?.total ?? 0;
  return { ...query, items, total };
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
        try {
          const response = await apiClient.upload<MediaItem>(endpoints.media.upload(), formData);
          if (response.data) uploaded.push(response.data);
        } catch (cause) {
          const detail =
            cause && typeof cause === 'object' && typeof (cause as { message?: unknown }).message === 'string'
              ? (cause as { message: string }).message
              : cause instanceof Error
                ? cause.message
                : 'upload failed';
          throw new Error(`${file.name}: ${detail}`);
        }
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
      const response = await apiClient.post<{ deleted: number; missing: string[] }>(
        endpoints.media.bulkDelete(),
        { ids }
      );
      return response.data;
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
  // The API returns null for unknown alt/width/height; the value contract
  // promises strings and numbers, so drop the nulls instead of storing them.
  const value: ImageValue = {
    url: media.url,
    alt: media.alt ?? '',
    filename: media.filename,
    size: media.size,
    mimeType: media.mimeType,
  };
  if (typeof media.width === 'number') value.width = media.width;
  if (typeof media.height === 'number') value.height = media.height;
  return value;
}

/**
 * Convert MediaItem to FileValue for field storage
 */
export function mediaToFileValue(media: MediaItem): FileValue {
  return {
    url: media.url,
    filename: media.originalName || media.filename,
    size: media.size,
    mimeType: media.mimeType,
  };
}
