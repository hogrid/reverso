# @reverso/cli

Command line interface for Reverso CMS.

## Installation

```bash
npm install -g @reverso/cli
```

Or use with npx:

```bash
npx @reverso/cli scan
```

## Commands

### `reverso scan`

Scan your codebase for `data-reverso` markers and generate schema.

```bash
reverso scan --watch
```

### `reverso dev`

Start development server with hot reloading.

```bash
reverso dev --port 4000
```

### `reverso migrate`

Run database migrations.

```bash
reverso migrate
reverso migrate:status
reverso migrate:reset
```

### `reverso build`

Build for production.

```bash
reverso build
```

### `reverso start`

Start production server.

```bash
reverso start --port 4000
```

## Configuration

Create `reverso.config.ts`:

```typescript
import { defineConfig } from '@reverso/core';

export default defineConfig({
  database: {
    type: 'sqlite',
    path: './data/reverso.db',
  },
});
```

## Documentation

See [https://reverso.dev/docs/packages/cli](https://reverso.dev/docs/packages/cli)

## License

MIT
