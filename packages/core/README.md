# @reverso/core

Core types, utilities, and configuration system for Reverso CMS.

## Installation

```bash
npm install @reverso/core
```

## Usage

```typescript
import { defineConfig, FieldType, parsePath, formatLabel } from '@reverso/core';

// Define CMS configuration
const config = defineConfig({
  database: {
    type: 'sqlite',
    path: './data/reverso.db',
  },
});

// Parse field paths
const { page, section, field } = parsePath('home.hero.title');

// Format field labels
const label = formatLabel('heroTitle'); // "Hero Title"
```

## Features

- **35+ Field Types**: text, wysiwyg, image, repeater, flexible, and more
- **Configuration System**: defineConfig helper with validation
- **Path Utilities**: Parse and build field paths
- **Naming Utilities**: Format labels, slugify, camelCase
- **Validation**: Zod schemas for all types

## Documentation

See [https://reverso.dev/docs/packages/core](https://reverso.dev/docs/packages/core)

## License

MIT
