/**
 * Types for the Reverso MCP Server.
 */

export interface McpServerConfig {
  /** Database path for SQLite */
  databasePath: string;
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
}

export interface ContentUpdateInput {
  path: string;
  value: unknown;
  locale?: string;
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
