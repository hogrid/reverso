---
title: "@reverso/scanner"
description: AST parser for detecting data-reverso markers in JSX/TSX files
---

# @reverso/scanner

The scanner package parses your React/Next.js codebase to detect `data-reverso-*` markers and generates the content schema.

## Installation

```bash
npm install @reverso/scanner
```

## How It Works

1. **Scans** your source directory for `.tsx`, `.jsx`, `.ts`, `.js` files
2. **Parses** each file using ts-morph (TypeScript AST parser)
3. **Extracts** all `data-reverso-*` attributes from JSX elements
4. **Generates** a structured schema of pages, sections, and fields

## Usage

### Via CLI (Recommended)

```bash
# Scan and update database
reverso scan

# Scan with custom directory
reverso scan --dir ./components

# Scan with verbose output
reverso scan --verbose
```

### Programmatic Usage

```typescript
import { Scanner } from '@reverso/scanner';

const scanner = new Scanner({
  contentDir: './src',
  extensions: ['.tsx', '.jsx'],
});

// Scan and get results
const result = await scanner.scan();

console.log(result.pages);    // Pages found
console.log(result.sections); // Sections found
console.log(result.fields);   // Fields found
console.log(result.markers);  // Raw marker data
```

## Configuration

```typescript
const scanner = new Scanner({
  // Directory to scan
  contentDir: './src',

  // File extensions to process
  extensions: ['.tsx', '.jsx', '.ts', '.js'],

  // Patterns to ignore
  ignore: [
    'node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/dist/**',
  ],

  // Custom marker attribute names (advanced)
  markers: {
    path: 'data-reverso',
    type: 'data-reverso-type',
    label: 'data-reverso-label',
    help: 'data-reverso-help',
    required: 'data-reverso-required',
    options: 'data-reverso-options',
  },
});
```

## Scan Result

```typescript
interface ScanResult {
  // Detected pages (from path prefix)
  pages: Array<{
    name: string;
    slug: string;
    path: string;
  }>;

  // Detected sections
  sections: Array<{
    pageSlug: string;
    name: string;
    slug: string;
    isRepeater: boolean;
  }>;

  // Detected fields
  fields: Array<{
    sectionSlug: string;
    name: string;
    type: FieldType;
    label?: string;
    help?: string;
    required: boolean;
    options?: string[];
    config: Record<string, unknown>;
  }>;

  // Raw markers with source location
  markers: MarkerInfo[];

  // Files processed
  files: string[];

  // Scan duration in ms
  duration: number;
}
```

## Marker Detection

The scanner looks for JSX elements with `data-reverso` attribute:

```tsx
// Basic text field
<h1 data-reverso="home.hero.title">Welcome</h1>

// With explicit type
<p
  data-reverso="home.hero.description"
  data-reverso-type="textarea"
>
  Description here
</p>

// With metadata
<img
  data-reverso="home.hero.image"
  data-reverso-type="image"
  data-reverso-label="Hero Image"
  data-reverso-help="Recommended size: 1920x1080"
  data-reverso-required="true"
/>

// With options (for select/radio)
<div
  data-reverso="home.hero.theme"
  data-reverso-type="select"
  data-reverso-options="light,dark,system"
/>
```

## Path Parsing

Paths follow the pattern: `{page}.{section}.{field}`

```
home.hero.title
│    │    └── Field name
│    └── Section name
└── Page name
```

For repeaters, use `$` as placeholder:

```
home.features.$.title
│    │        │  └── Field name
│    │        └── Repeater indicator
│    └── Section name (repeater)
└── Page name
```

## Type Inference

When `data-reverso-type` is not specified, the scanner infers from:

1. **HTML element**: `<img>` → `image`, `<a>` → `link`
2. **Common patterns**: `title`, `name` → `text`
3. **Default**: Falls back to `text`

```tsx
// Inferred as 'image' from <img> element
<img data-reverso="home.hero.bg" />

// Inferred as 'link' from <a> element
<a data-reverso="home.hero.cta">Click here</a>

// Inferred as 'text' (default)
<span data-reverso="home.hero.subtitle">Text here</span>
```

## Validation

The scanner validates:

- **Path format**: Must be `page.section.field`
- **Field types**: Must be valid FieldType
- **Uniqueness**: No duplicate paths
- **Required fields**: All required attributes present

```typescript
const result = await scanner.scan();

if (result.errors.length > 0) {
  console.error('Validation errors:');
  result.errors.forEach(err => {
    console.error(`  ${err.file}:${err.line} - ${err.message}`);
  });
}
```

## Watch Mode

Monitor files for changes:

```typescript
const scanner = new Scanner({ contentDir: './src' });

scanner.watch({
  onChange: async (result) => {
    console.log('Schema updated:', result.fields.length, 'fields');
    // Sync to database
  },
  onError: (error) => {
    console.error('Scan error:', error);
  },
});

// Stop watching
scanner.stopWatch();
```

## Database Sync

Sync scan results to database:

```typescript
import { Scanner, syncToDatabase } from '@reverso/scanner';
import { createDatabase } from '@reverso/db';

const scanner = new Scanner({ contentDir: './src' });
const db = await createDatabase({ url: '.reverso/data.db' });

const result = await scanner.scan();
await syncToDatabase(db, result);
```

## API Reference

### Scanner Class

```typescript
class Scanner {
  constructor(options: ScannerOptions);

  // Run a scan
  scan(): Promise<ScanResult>;

  // Start watching for changes
  watch(callbacks: WatchCallbacks): void;

  // Stop watching
  stopWatch(): void;

  // Get current configuration
  getConfig(): ScannerOptions;
}
```

### Types

```typescript
interface ScannerOptions {
  contentDir: string;
  extensions?: string[];
  ignore?: string[];
  markers?: MarkerAttributes;
}

interface MarkerInfo {
  path: string;
  type: FieldType;
  label?: string;
  help?: string;
  required?: boolean;
  options?: string[];
  config?: Record<string, unknown>;
  filePath: string;
  line: number;
  column: number;
}
```

## Best Practices

### 1. Use Consistent Naming

```tsx
// Good: consistent pattern
<h1 data-reverso="home.hero.title">...</h1>
<p data-reverso="home.hero.subtitle">...</p>
<img data-reverso="home.hero.image" />

// Bad: inconsistent
<h1 data-reverso="homeHeroTitle">...</h1>
<p data-reverso="home_hero_subtitle">...</p>
```

### 2. Add Labels and Help

```tsx
<img
  data-reverso="home.hero.background"
  data-reverso-type="image"
  data-reverso-label="Hero Background"
  data-reverso-help="Use 1920x1080 JPG for best results"
/>
```

### 3. Group Related Fields

Keep related markers together in the same component or section.

### 4. Run Scan on Build

```json
{
  "scripts": {
    "prebuild": "reverso scan",
    "build": "next build"
  }
}
```

## Next Steps

- [@reverso/db](/packages/db/) - Database layer
- [@reverso/cli](/packages/cli/) - CLI commands
