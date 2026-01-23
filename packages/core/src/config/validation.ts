/**
 * Zod schemas for configuration validation.
 */

import { z } from 'zod';

/**
 * Database provider schema.
 */
export const databaseProviderSchema = z.enum(['sqlite', 'postgresql', 'mysql']);

/**
 * Database configuration schema.
 */
export const databaseConfigSchema = z.object({
  provider: databaseProviderSchema,
  url: z.string().min(1),
  autoMigrate: z.boolean().optional(),
  logging: z.boolean().optional(),
  poolSize: z.number().positive().optional(),
  ssl: z.union([z.boolean(), z.object({ rejectUnauthorized: z.boolean() })]).optional(),
});

/**
 * OAuth provider configuration schema.
 */
export const oauthProviderSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url().optional(),
});

/**
 * Auth configuration schema.
 */
export const authConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['better-auth', 'custom']),
  secret: z.string().min(32),
  sessionDuration: z.number().positive().optional(),
  oauth: z
    .object({
      google: oauthProviderSchema.optional(),
      github: oauthProviderSchema.optional(),
    })
    .optional(),
  emailPassword: z
    .object({
      enabled: z.boolean(),
      requireEmailVerification: z.boolean().optional(),
    })
    .optional(),
  magicLink: z
    .object({
      enabled: z.boolean(),
    })
    .optional(),
});

/**
 * S3 configuration schema.
 */
export const s3ConfigSchema = z.object({
  bucket: z.string().min(1),
  region: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  endpoint: z.string().url().optional(),
  publicUrl: z.string().url().optional(),
});

/**
 * Uploads configuration schema.
 */
export const uploadsConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'cloudinary', 'uploadthing']),
  maxFileSize: z.number().positive().optional(),
  allowedTypes: z.array(z.string()).optional(),
  directory: z.string().optional(),
  s3: s3ConfigSchema.optional(),
  cloudinary: z
    .object({
      cloudName: z.string().min(1),
      apiKey: z.string().min(1),
      apiSecret: z.string().min(1),
      folder: z.string().optional(),
    })
    .optional(),
  uploadthing: z
    .object({
      token: z.string().min(1),
    })
    .optional(),
});

/**
 * Admin configuration schema.
 */
export const adminConfigSchema = z.object({
  path: z.string().startsWith('/').optional(),
  title: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  darkMode: z.boolean().optional(),
  favicon: z.string().optional(),
  disabled: z.boolean().optional(),
});

/**
 * CORS configuration schema.
 */
export const corsConfigSchema = z.union([
  z.boolean(),
  z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]),
    methods: z.array(z.string()).optional(),
    allowedHeaders: z.array(z.string()).optional(),
    credentials: z.boolean().optional(),
  }),
]);

/**
 * Rate limit configuration schema.
 */
export const rateLimitConfigSchema = z.object({
  max: z.number().positive(),
  windowMs: z.number().positive(),
});

/**
 * API configuration schema.
 */
export const apiConfigSchema = z.object({
  path: z.string().startsWith('/').optional(),
  graphql: z.boolean().optional(),
  rest: z.boolean().optional(),
  cors: corsConfigSchema.optional(),
  rateLimit: rateLimitConfigSchema.optional(),
  apiKey: z.string().optional(),
});

/**
 * Scanner configuration schema.
 */
export const scannerConfigSchema = z.object({
  srcDir: z.string().optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  outputDir: z.string().optional(),
  watch: z
    .object({
      enabled: z.boolean().optional(),
      debounce: z.number().positive().optional(),
    })
    .optional(),
});

/**
 * Plugin configuration schema.
 */
export const pluginConfigSchema = z.object({
  name: z.string().min(1),
  options: z.record(z.unknown()).optional(),
});

/**
 * Hooks configuration schema.
 */
export const hooksConfigSchema = z.object({
  beforeSave: z.string().optional(),
  afterSave: z.string().optional(),
  beforeDelete: z.string().optional(),
  afterDelete: z.string().optional(),
});

/**
 * Development configuration schema.
 */
export const devConfigSchema = z.object({
  port: z.number().positive().optional(),
  hotReload: z.boolean().optional(),
});

/**
 * Main Reverso configuration schema.
 */
export const configSchema = z.object({
  name: z.string().optional(),
  srcDir: z.string().optional(),
  outputDir: z.string().optional(),
  database: databaseConfigSchema,
  auth: authConfigSchema.optional(),
  uploads: uploadsConfigSchema.optional(),
  admin: adminConfigSchema.optional(),
  api: apiConfigSchema.optional(),
  scanner: scannerConfigSchema.optional(),
  plugins: z.array(pluginConfigSchema).optional(),
  hooks: hooksConfigSchema.optional(),
  dev: devConfigSchema.optional(),
});

/**
 * Type inference from schema.
 */
export type ValidatedConfig = z.infer<typeof configSchema>;
