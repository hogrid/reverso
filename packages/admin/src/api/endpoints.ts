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
      path ? `${API_BASE}/content/${path}` : `${API_BASE}/content/page/${pageSlug}`,
    update: (pageSlug: string, path?: string) =>
      path ? `${API_BASE}/content/${path}` : `${API_BASE}/content/page/${pageSlug}`,
  },

  // Media endpoints
  media: {
    list: () => `${API_BASE}/media`,
    get: (id: string) => `${API_BASE}/media/${id}`,
    upload: () => `${API_BASE}/media`,
    delete: (id: string) => `${API_BASE}/media/${id}`,
    bulk: () => `${API_BASE}/media/bulk`,
  },

  // Health check
  health: () => `${API_BASE}/health`,

  // Stats
  stats: () => `${API_BASE}/stats`,

  // Forms endpoints
  forms: {
    list: () => `${API_BASE}/forms`,
    get: (id: string) => `${API_BASE}/forms/${id}`,
    create: () => `${API_BASE}/forms`,
    update: (id: string) => `${API_BASE}/forms/${id}`,
    delete: (id: string) => `${API_BASE}/forms/${id}`,
    duplicate: (id: string) => `${API_BASE}/forms/${id}/duplicate`,
    publish: (id: string) => `${API_BASE}/forms/${id}/publish`,
    unpublish: (id: string) => `${API_BASE}/forms/${id}/unpublish`,
    // Fields
    addField: (id: string) => `${API_BASE}/forms/${id}/fields`,
    updateField: (id: string, fieldId: string) => `${API_BASE}/forms/${id}/fields/${fieldId}`,
    deleteField: (id: string, fieldId: string) => `${API_BASE}/forms/${id}/fields/${fieldId}`,
    reorderFields: (id: string) => `${API_BASE}/forms/${id}/fields/reorder`,
    // Submissions
    submissions: (id: string) => `${API_BASE}/forms/${id}/submissions`,
    submission: (id: string, subId: string) => `${API_BASE}/forms/${id}/submissions/${subId}`,
    submissionStatus: (id: string, subId: string) =>
      `${API_BASE}/forms/${id}/submissions/${subId}/status`,
    exportSubmissions: (id: string) => `${API_BASE}/forms/${id}/submissions/export`,
  },

  // Redirects endpoints
  redirects: {
    list: () => `${API_BASE}/redirects`,
    get: (id: string) => `${API_BASE}/redirects/${id}`,
    create: () => `${API_BASE}/redirects`,
    update: (id: string) => `${API_BASE}/redirects/${id}`,
    delete: (id: string) => `${API_BASE}/redirects/${id}`,
    enable: (id: string) => `${API_BASE}/redirects/${id}/enable`,
    disable: (id: string) => `${API_BASE}/redirects/${id}/disable`,
    bulkImport: () => `${API_BASE}/redirects/bulk-import`,
    export: () => `${API_BASE}/redirects/export`,
  },
} as const;
