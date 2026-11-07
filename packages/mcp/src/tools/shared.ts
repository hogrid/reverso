/**
 * Shared types and schemas for MCP tools.
 */

import { z } from 'zod';
import type { ReversoApiClient } from '../api-client.js';

/**
 * A tool as the server registers it: a description, a zod object schema the
 * MCP SDK exposes to clients (and validates arguments against), and a handler
 * that talks to the Reverso API.
 */
export interface ToolDefinition<Input = never, Output = unknown> {
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (api: ReversoApiClient, input: Input) => Promise<Output>;
}

/**
 * A JSON value for a content field. Unlike `z.unknown()`, this makes `value`
 * a required argument: a write without a value is rejected before any request
 * reaches the API.
 */
export const contentValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

export type ContentValueInput = z.infer<typeof contentValueSchema>;

/** First segment of a dotted field path is the page slug. */
export function pageSlugOf(path: string): string {
  return path.split('.')[0] ?? path;
}
