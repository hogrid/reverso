/**
 * File watcher for detecting changes in source files.
 */

import { resolve } from 'node:path';
import {
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_WATCH_DEBOUNCE,
} from '@reverso/core';
import { type FSWatcher, watch } from 'chokidar';

/**
 * Events emitted by the watcher.
 */
export type WatchEventType = 'add' | 'change' | 'unlink';

/**
 * Watch event data.
 */
export interface WatchEvent {
  type: WatchEventType;
  path: string;
  timestamp: number;
}

/**
 * Watch event handler.
 */
export type WatchEventHandler = (event: WatchEvent) => void | Promise<void>;

/**
 * Options for the file watcher.
 */
export interface WatcherOptions {
  /** Directory to watch */
  srcDir: string;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Event handler */
  onEvent?: WatchEventHandler;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Ready handler */
  onReady?: () => void;
}

/**
 * File watcher class.
 */
export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private options: WatcherOptions;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceDelay: number;
  private isReady = false;

  constructor(options: WatcherOptions) {
    this.options = options;
    this.debounceDelay = options.debounce ?? DEFAULT_WATCH_DEBOUNCE;
  }

  /**
   * Start watching for file changes.
   */
  start(): void {
    if (this.watcher) {
      return;
    }

    const srcDir = resolve(this.options.srcDir);
    const include = this.options.include ?? [...DEFAULT_INCLUDE_PATTERNS];
    const exclude = this.options.exclude ?? [...DEFAULT_EXCLUDE_PATTERNS];

    // Create glob patterns for chokidar
    const patterns = include.map((pattern) => `${srcDir}/${pattern}`);

    this.watcher = watch(patterns, {
      ignored: exclude,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // Set up event handlers
    this.watcher.on('add', (path) => this.handleEvent('add', path));
    this.watcher.on('change', (path) => this.handleEvent('change', path));
    this.watcher.on('unlink', (path) => this.handleEvent('unlink', path));

    this.watcher.on('error', (error: unknown) => {
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    });

    this.watcher.on('ready', () => {
      this.isReady = true;
      if (this.options.onReady) {
        this.options.onReady();
      }
    });
  }

  /**
   * Stop watching for file changes.
   */
  async stop(): Promise<void> {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.isReady = false;
    }
  }

  /**
   * Check if the watcher is running.
   */
  isRunning(): boolean {
    return this.watcher !== null;
  }

  /**
   * Check if the watcher is ready (initial scan complete).
   */
  ready(): boolean {
    return this.isReady;
  }

  /**
   * Handle a file system event with debouncing.
   */
  private handleEvent(type: WatchEventType, path: string): void {
    // Clear existing timer for this path
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(path);
      this.emitEvent(type, path);
    }, this.debounceDelay);

    this.debounceTimers.set(path, timer);
  }

  /**
   * Emit an event to the handler.
   */
  private emitEvent(type: WatchEventType, path: string): void {
    if (this.options.onEvent) {
      const event: WatchEvent = {
        type,
        path,
        timestamp: Date.now(),
      };

      // Call handler (may be async)
      Promise.resolve(this.options.onEvent(event)).catch((err: unknown) => {
        if (this.options.onError) {
          this.options.onError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    }
  }

  /**
   * Get the watched paths.
   */
  getWatchedPaths(): string[] {
    if (!this.watcher) {
      return [];
    }

    const watched = this.watcher.getWatched();
    const paths: string[] = [];

    for (const [dir, files] of Object.entries(watched)) {
      for (const file of files) {
        paths.push(`${dir}/${file}`);
      }
    }

    return paths;
  }
}

/**
 * Create a new file watcher.
 */
export function createWatcher(options: WatcherOptions): FileWatcher {
  return new FileWatcher(options);
}
