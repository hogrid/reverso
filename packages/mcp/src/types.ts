/**
 * Types for the Reverso MCP Server.
 */

export interface McpServerConfig {
  /**
   * Base URL of the Reverso API the server talks to
   * (default: `REVERSO_API_URL` or `http://localhost:3001`).
   */
  apiUrl?: string;
  /**
   * Admin API key sent as `X-API-Key` on every request. Required, at least
   * 16 characters: the server refuses to start without a usable key.
   */
  apiKey: string;
  /** Server name advertised to MCP clients */
  name?: string;
  /** Server version advertised to MCP clients */
  version?: string;
  /** Fetch implementation (default: global `fetch`); injectable for tests */
  fetch?: typeof fetch;
}

export interface ContentUpdateInput {
  path: string;
  value: unknown;
  locale?: string;
  publish?: boolean;
}

export interface ContentGenerationInput {
  fieldType: string;
  context?: string;
  maxLength?: number;
  tone?: 'formal' | 'casual' | 'professional' | 'friendly';
  language?: string;
}

export interface FieldTypeSuggestion {
  type: string;
  confidence: number;
  reason: string;
}

export interface ContentAnalysis {
  wordCount: number;
  readability: 'easy' | 'medium' | 'hard';
  suggestions: string[];
  seoScore?: number;
}
