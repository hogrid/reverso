/**
 * API Endpoints for Reverso CMS
 */

export const API_BASE = '/api/reverso';

export const endpoints = {
  // Schema endpoints
  schema: {
    get: () => `${API_BASE}/schema`,
    page: (slug: string) => `${API_BASE}/schema/${slug}`,
  },

  // Pages endpoints
  pages: {
    list: () => `${API_BASE}/pages`,
    get: (slug: string) => `${API_BASE}/pages/${slug}`,
    create: () => `${API_BASE}/pages`,
    update: (slug: string) => `${API_BASE}/pages/${slug}`,
    delete: (slug: string) => `${API_BASE}/pages/${slug}`,
  },

  // Content endpoints
  content: {
    get: (pageSlug: string, path?: string) =>
      path ? `${API_BASE}/content/${pageSlug}/${path}` : `${API_BASE}/content/${pageSlug}`,
    update: (pageSlug: string, path?: string) =>
      path ? `${API_BASE}/content/${pageSlug}/${path}` : `${API_BASE}/content/${pageSlug}`,
  },

  // Media endpoints
  media: {
    list: () => `${API_BASE}/media`,
    get: (id: string) => `${API_BASE}/media/${id}`,
    upload: () => `${API_BASE}/media/upload`,
    delete: (id: string) => `${API_BASE}/media/${id}`,
    bulk: () => `${API_BASE}/media/bulk`,
  },

  // Health check
  health: () => `${API_BASE}/health`,

  // Stats
  stats: () => `${API_BASE}/stats`,
} as const;
