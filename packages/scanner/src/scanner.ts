/**
 * Main Scanner class that orchestrates parsing, schema generation, and output.
 */

import { resolve } from 'node:path';
import {
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_SRC_DIR,
  type ProjectSchema,
  type ScanOptions,
  type ScanResult,
  type SchemaDiff,
} from '@reverso/core';
import {
  type JsonWriterOptions,
  type TypesWriterOptions,
  compareSchemas,
  readJsonSchema,
  writeJsonSchema,
  writeTypesFile,
} from './output/index.js';
import { type AstParser, type ParseResult, createParser } from './parser/index.js';
import { generateSchema, updateSchemaMeta } from './schema/index.js';
import { type FileWatcher, type WatchEvent, createWatcher } from './watch/index.js';

/**
 * Scanner options.
 */
export interface ScannerOptions {
  /** Source directory to scan */
  srcDir?: string;
  /** Output directory for schema files */
  outputDir?: string;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** TypeScript config file path */
  tsConfigFilePath?: string;
  /** Watch mode */
  watch?: boolean;
  /** Watch debounce delay in milliseconds */
  watchDebounce?: number;
  /** Generate TypeScript types */
  generateTypes?: boolean;
  /** Pretty print JSON output */
  prettyPrint?: boolean;
}

/**
 * Scan event types.
 */
export type ScanEventType = 'start' | 'complete' | 'error' | 'change';

/**
 * Scan event data.
 */
export interface ScanEvent {
  type: ScanEventType;
  schema?: ProjectSchema;
  diff?: SchemaDiff;
  error?: Error;
  changedFile?: string;
}

/**
 * Scan event handler.
 */
export type ScanEventHandler = (event: ScanEvent) => void;

/**
 * Main Scanner class.
 */
export class Scanner {
  private parser: AstParser;
  private watcher: FileWatcher | null = null;
  private options: Required<ScannerOptions>;
  private currentSchema: ProjectSchema | null = null;
  private eventHandlers: Set<ScanEventHandler> = new Set();

  constructor(options: ScannerOptions = {}) {
    this.options = {
      srcDir: options.srcDir ?? DEFAULT_SRC_DIR,
      outputDir: options.outputDir ?? DEFAULT_OUTPUT_DIR,
      include: options.include ?? [...DEFAULT_INCLUDE_PATTERNS],
      exclude: options.exclude ?? [...DEFAULT_EXCLUDE_PATTERNS],
      tsConfigFilePath: options.tsConfigFilePath ?? '',
      watch: options.watch ?? false,
      watchDebounce: options.watchDebounce ?? 300,
      generateTypes: options.generateTypes ?? true,
      prettyPrint: options.prettyPrint ?? true,
    };

    // Create parser
    this.parser = createParser({
      srcDir: resolve(this.options.srcDir),
      include: this.options.include,
      exclude: this.options.exclude,
      tsConfigFilePath: this.options.tsConfigFilePath || undefined,
    });
  }

  /**
   * Subscribe to scan events.
   */
  on(handler: ScanEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Emit an event to all handlers.
   */
  private emit(event: ScanEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in scan event handler:', error);
      }
    }
  }

  /**
   * Run a full scan of the source directory.
   */
  async scan(): Promise<ScanResult> {
    this.emit({ type: 'start' });

    try {
      // Parse all files
      const parseResult = await this.parser.parseAll();

      // Generate schema
      let schema = generateSchema(parseResult.fields, {
        includeSourceInfo: true,
        includeDefaults: true,
        sort: true,
      });

      // Update metadata
      const filesWithMarkers = new Set(parseResult.fields.map((f) => f.file)).size;
      schema = updateSchemaMeta(schema, {
        srcDir: this.options.srcDir,
        filesScanned: parseResult.fileResults.length,
        filesWithMarkers,
        scanDuration: parseResult.duration,
      });

      // Compare with existing schema
      const existingSchema = await readJsonSchema({
        outputDir: resolve(this.options.outputDir),
      });
      const diff = compareSchemas(existingSchema, schema);

      // Write output files
      const outputDir = resolve(this.options.outputDir);
      await writeJsonSchema(schema, {
        outputDir,
        pretty: this.options.prettyPrint,
      });

      if (this.options.generateTypes) {
        await writeTypesFile(schema, {
          outputDir,
          includeComments: true,
        });
      }

      // Store current schema
      this.currentSchema = schema;

      // Emit complete event
      this.emit({ type: 'complete', schema, diff });

      return {
        schema,
        files: parseResult.fileResults,
        errors: parseResult.errors,
        success: parseResult.errors.length === 0,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err });
      throw err;
    }
  }

  /**
   * Start watching for file changes.
   */
  async startWatch(): Promise<void> {
    if (this.watcher) {
      return;
    }

    // Run initial scan
    await this.scan();

    // Create watcher
    this.watcher = createWatcher({
      srcDir: resolve(this.options.srcDir),
      include: this.options.include,
      exclude: this.options.exclude,
      debounce: this.options.watchDebounce,
      onEvent: (event) => this.handleWatchEvent(event),
      onError: (error) => this.emit({ type: 'error', error }),
      onReady: () => {},
    });

    this.watcher.start();
  }

  /**
   * Stop watching for file changes.
   */
  async stopWatch(): Promise<void> {
    if (this.watcher) {
      await this.watcher.stop();
      this.watcher = null;
    }
  }

  /**
   * Handle a file watch event.
   */
  private async handleWatchEvent(event: WatchEvent): Promise<void> {
    try {
      this.emit({ type: 'change', changedFile: event.path });

      if (event.type === 'unlink') {
        // File was deleted, remove from parser and rescan
        this.parser.removeFile(event.path);
      }

      // Rescan all files
      await this.scan();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: 'error', error: err });
    }
  }

  /**
   * Get the current schema.
   */
  getSchema(): ProjectSchema | null {
    return this.currentSchema;
  }

  /**
   * Check if watch mode is active.
   */
  isWatching(): boolean {
    return this.watcher?.isRunning() ?? false;
  }

  /**
   * Clear cached data.
   */
  clear(): void {
    this.parser.clear();
    this.currentSchema = null;
  }
}

/**
 * Create a new scanner instance.
 */
export function createScanner(options: ScannerOptions = {}): Scanner {
  return new Scanner(options);
}

/**
 * Run a one-time scan.
 */
export async function scan(options: ScanOptions): Promise<ScanResult> {
  const scanner = createScanner({
    srcDir: options.srcDir,
    include: options.include,
    exclude: options.exclude,
    watch: false,
    generateTypes: true,
  });

  return scanner.scan();
}
