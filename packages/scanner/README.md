# @reverso/scanner

AST parser for detecting `data-reverso` markers in React/Next.js code.

## Installation

```bash
npm install @reverso/scanner
```

## Usage

```typescript
import { Scanner } from '@reverso/scanner';

const scanner = new Scanner({
  rootDir: './src',
  include: ['**/*.tsx'],
  exclude: ['**/node_modules/**'],
});

// Scan and generate schema
const schema = await scanner.scan();

// Watch for changes
scanner.watch((schema) => {
  console.log('Schema updated:', schema.pages.length, 'pages');
});
```

## Features

- **AST Parsing**: Uses ts-morph for accurate JSX analysis
- **Marker Detection**: Finds all `data-reverso-*` attributes
- **Schema Generation**: Creates structured schema from markers
- **Watch Mode**: Real-time scanning with chokidar
- **Type Inference**: Detects field types from attributes

## Documentation

See [https://reverso.dev/docs/packages/scanner](https://reverso.dev/docs/packages/scanner)

## License

MIT
