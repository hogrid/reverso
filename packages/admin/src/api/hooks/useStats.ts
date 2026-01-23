import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export interface DashboardStats {
  pages: {
    total: number;
    withContent: number;
  };
  fields: {
    total: number;
    byType: Record<string, number>;
  };
  media: {
    total: number;
    totalSize: number;
    byType: Record<string, number>;
  };
  recentActivity: Array<{
    id: string;
    type: 'content_update' | 'media_upload' | 'schema_change';
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

/**
 * Fetch dashboard statistics
 */
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStats>(endpoints.stats());
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Health check
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get<{ status: 'ok' | 'error'; version: string }>(
        endpoints.health()
      );
      return response.data;
    },
    refetchInterval: 60 * 1000, // Every minute
  });
}
