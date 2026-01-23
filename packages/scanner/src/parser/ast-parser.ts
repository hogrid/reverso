/**
 * Main AST parser using ts-morph.
 */

import { relative, resolve } from 'node:path';
import {
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  type DetectedField,
  type FileScanResult,
  type ScanError,
} from '@reverso/core';
import { glob } from 'glob';
import { Project, type SourceFile } from 'ts-morph';
import { type JsxWalkerOptions, walkJsxElements } from './jsx-walker.js';

/**
 * Options for the AST parser.
 */
export interface AstParserOptions {
  /** Directory to scan */
  srcDir: string;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** TypeScript config path */
  tsConfigFilePath?: string;
  /** JSX walker options */
  walker?: JsxWalkerOptions;
}

/**
 * Result of parsing all files.
 */
export interface ParseResult {
  /** All detected fields */
  fields: DetectedField[];
  /** Results per file */
  fileResults: FileScanResult[];
  /** Errors encountered */
  errors: ScanError[];
  /** Total duration in milliseconds */
  duration: number;
}

/**
 * AST parser for detecting data-reverso markers.
 */
export class AstParser {
  private project: Project;
  private options: AstParserOptions;

  constructor(options: AstParserOptions) {
    this.options = {
      include: [...DEFAULT_INCLUDE_PATTERNS],
      exclude: [...DEFAULT_EXCLUDE_PATTERNS],
      ...options,
    };

    // Create ts-morph project
    this.project = new Project({
      tsConfigFilePath: options.tsConfigFilePath,
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      compilerOptions: {
        jsx: 4, // JsxEmit.ReactJSX
        allowJs: true,
        checkJs: false,
        noEmit: true,
        skipLibCheck: true,
      },
    });
  }

  /**
   * Find all files matching the include/exclude patterns.
   */
  async findFiles(): Promise<string[]> {
    const srcDir = resolve(this.options.srcDir);
    const include = this.options.include ?? [...DEFAULT_INCLUDE_PATTERNS];
    const exclude = this.options.exclude ?? [...DEFAULT_EXCLUDE_PATTERNS];

    const files: string[] = [];

    for (const pattern of include) {
      const matches = await glob(pattern, {
        cwd: srcDir,
        absolute: true,
        ignore: exclude,
        nodir: true,
      });
      files.push(...matches);
    }

    // Deduplicate
    return [...new Set(files)];
  }

  /**
   * Parse a single source file.
   */
  parseFile(sourceFile: SourceFile): FileScanResult {
    const startTime = performance.now();
    const filePath = sourceFile.getFilePath();
    const errors: ScanError[] = [];

    try {
      const fields = walkJsxElements(sourceFile, this.options.walker);

      return {
        file: filePath,
        fields,
        errors,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      errors.push({
        type: 'parse',
        message: error instanceof Error ? error.message : String(error),
        file: filePath,
      });

      return {
        file: filePath,
        fields: [],
        errors,
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Parse all files in the source directory.
   */
  async parseAll(): Promise<ParseResult> {
    const startTime = performance.now();
    const errors: ScanError[] = [];
    const fileResults: FileScanResult[] = [];
    const allFields: DetectedField[] = [];

    try {
      // Find all files
      const filePaths = await this.findFiles();

      // Add files to project
      for (const filePath of filePaths) {
        try {
          this.project.addSourceFileAtPath(filePath);
        } catch (error) {
          errors.push({
            type: 'io',
            message: `Failed to add file: ${error instanceof Error ? error.message : String(error)}`,
            file: filePath,
          });
        }
      }

      // Parse each file
      const sourceFiles = this.project.getSourceFiles();
      for (const sourceFile of sourceFiles) {
        const result = this.parseFile(sourceFile);
        fileResults.push(result);
        allFields.push(...result.fields);
        errors.push(...result.errors);
      }
    } catch (error) {
      errors.push({
        type: 'io',
        message: `Failed to scan directory: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return {
      fields: allFields,
      fileResults,
      errors,
      duration: performance.now() - startTime,
    };
  }

  /**
   * Parse a single file by path.
   */
  async parseSingleFile(filePath: string): Promise<FileScanResult> {
    const absolutePath = resolve(filePath);

    try {
      // Check if file already exists in project
      let sourceFile = this.project.getSourceFile(absolutePath);

      if (!sourceFile) {
        sourceFile = this.project.addSourceFileAtPath(absolutePath);
      } else {
        // Refresh the file content
        await sourceFile.refreshFromFileSystem();
      }

      return this.parseFile(sourceFile);
    } catch (error) {
      return {
        file: absolutePath,
        fields: [],
        errors: [
          {
            type: 'io',
            message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
            file: absolutePath,
          },
        ],
        duration: 0,
      };
    }
  }

  /**
   * Update a file in the project (for watch mode).
   */
  async updateFile(filePath: string): Promise<FileScanResult> {
    return this.parseSingleFile(filePath);
  }

  /**
   * Remove a file from the project (for watch mode).
   */
  removeFile(filePath: string): void {
    const absolutePath = resolve(filePath);
    const sourceFile = this.project.getSourceFile(absolutePath);
    if (sourceFile) {
      this.project.removeSourceFile(sourceFile);
    }
  }

  /**
   * Get the relative path from the source directory.
   */
  getRelativePath(filePath: string): string {
    return relative(this.options.srcDir, filePath);
  }

  /**
   * Clear all files from the project.
   */
  clear(): void {
    const sourceFiles = this.project.getSourceFiles();
    for (const file of sourceFiles) {
      this.project.removeSourceFile(file);
    }
  }
}

/**
 * Create a new AST parser instance.
 */
export function createParser(options: AstParserOptions): AstParser {
  return new AstParser(options);
}
