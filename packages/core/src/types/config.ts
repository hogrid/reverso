/**
 * Configuration type definitions for Reverso CMS.
 */

/**
 * Database configuration options.
 */
export interface DatabaseConfig {
  /** Database provider */
  provider: 'sqlite' | 'postgresql' | 'mysql';
  /** Connection URL or path */
  url: string;
  /** Enable migrations on startup */
  autoMigrate?: boolean;
  /** Enable query logging */
  logging?: boolean;
  /** Connection pool size (for PostgreSQL/MySQL) */
  poolSize?: number;
}

/**
 * SQLite-specific database configuration.
 */
export interface SqliteDatabaseConfig extends DatabaseConfig {
  provider: 'sqlite';
  /** Path to SQLite file */
  url: string;
}

/**
 * PostgreSQL-specific database configuration.
 */
export interface PostgresDatabaseConfig extends DatabaseConfig {
  provider: 'postgresql';
  /** PostgreSQL connection URL */
  url: string;
  /** SSL configuration */
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Authentication configuration.
 */
export interface AuthConfig {
  /** Enable authentication */
  enabled: boolean;
  /** Auth provider */
  provider: 'better-auth' | 'custom';
  /** Session secret (required) */
  secret: string;
  /** Session duration in seconds */
  sessionDuration?: number;
  /** OAuth providers configuration */
  oauth?: {
    google?: OAuthProviderConfig;
    github?: OAuthProviderConfig;
  };
  /** Email/password authentication */
  emailPassword?: {
    enabled: boolean;
    requireEmailVerification?: boolean;
  };
  /** Magic link authentication */
  magicLink?: {
    enabled: boolean;
  };
}

/**
 * OAuth provider configuration.
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

/**
 * File uploads configuration.
 */
export interface UploadsConfig {
  /** Upload provider */
  provider: 'local' | 's3' | 'cloudinary' | 'uploadthing';
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Local storage directory (for 'local' provider) */
  directory?: string;
  /** S3 configuration (for 's3' provider) */
  s3?: S3Config;
  /** Cloudinary configuration */
  cloudinary?: CloudinaryConfig;
  /** UploadThing configuration */
  uploadthing?: UploadThingConfig;
}

/**
 * S3 storage configuration.
 */
export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
}

/**
 * Cloudinary storage configuration.
 */
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

/**
 * UploadThing configuration.
 */
export interface UploadThingConfig {
  token: string;
}

/**
 * Admin panel configuration.
 */
export interface AdminConfig {
  /** Admin panel path (default: '/admin') */
  path?: string;
  /** Custom title */
  title?: string;
  /** Custom logo URL */
  logo?: string;
  /** Primary color for theming */
  primaryColor?: string;
  /** Enable dark mode */
  darkMode?: boolean;
  /** Custom favicon */
  favicon?: string;
  /** Disable admin panel entirely */
  disabled?: boolean;
}

/**
 * API configuration.
 */
export interface ApiConfig {
  /** API base path (default: '/api/reverso') */
  path?: string;
  /** Enable GraphQL endpoint */
  graphql?: boolean;
  /** Enable REST endpoint */
  rest?: boolean;
  /** Enable CORS */
  cors?: boolean | CorsConfig;
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  /** API key for external access */
  apiKey?: string;
}

/**
 * CORS configuration.
 */
export interface CorsConfig {
  origin: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

/**
 * Rate limiting configuration.
 */
export interface RateLimitConfig {
  /** Requests per window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Scanner configuration.
 */
export interface ScannerConfig {
  /** Directory to scan (default: 'src') */
  srcDir?: string;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Output directory for schema (default: '.reverso') */
  outputDir?: string;
  /** Watch mode settings */
  watch?: {
    /** Enable watch mode in development */
    enabled?: boolean;
    /** Debounce delay in milliseconds */
    debounce?: number;
  };
}

/**
 * Plugin configuration.
 */
export interface PluginConfig {
  /** Plugin name */
  name: string;
  /** Plugin options */
  options?: Record<string, unknown>;
}

/**
 * Hooks configuration for extending Reverso behavior.
 */
export interface HooksConfig {
  /** Called before saving content */
  beforeSave?: string;
  /** Called after saving content */
  afterSave?: string;
  /** Called before deleting content */
  beforeDelete?: string;
  /** Called after deleting content */
  afterDelete?: string;
}

/**
 * Main Reverso configuration.
 */
export interface ReversoConfig {
  /**
   * Project name.
   * Used in admin panel title and generated files.
   */
  name?: string;

  /**
   * Source directory to scan for markers.
   * @default 'src'
   */
  srcDir?: string;

  /**
   * Output directory for generated files.
   * @default '.reverso'
   */
  outputDir?: string;

  /**
   * Database configuration.
   */
  database: DatabaseConfig;

  /**
   * Authentication configuration.
   */
  auth?: AuthConfig;

  /**
   * File uploads configuration.
   */
  uploads?: UploadsConfig;

  /**
   * Admin panel configuration.
   */
  admin?: AdminConfig;

  /**
   * API configuration.
   */
  api?: ApiConfig;

  /**
   * Scanner configuration.
   */
  scanner?: ScannerConfig;

  /**
   * Plugins to load.
   */
  plugins?: PluginConfig[];

  /**
   * Hooks for extending behavior.
   */
  hooks?: HooksConfig;

  /**
   * Development mode settings.
   */
  dev?: {
    /** Port for admin panel (default: 4000) */
    port?: number;
    /** Enable hot reload */
    hotReload?: boolean;
  };
}

/**
 * Resolved configuration with all defaults applied.
 */
export interface ResolvedConfig
  extends Required<Omit<ReversoConfig, 'auth' | 'uploads' | 'plugins' | 'hooks'>> {
  auth: AuthConfig | undefined;
  uploads: UploadsConfig | undefined;
  plugins: PluginConfig[];
  hooks: HooksConfig | undefined;
}
