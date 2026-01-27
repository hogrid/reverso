# @reverso/db

Database schema and migrations for Reverso CMS using Drizzle ORM.

## Installation

```bash
npm install @reverso/db
```

## Usage

```typescript
import { createDatabase, syncSchema, getPages, getContent } from '@reverso/db';

// Initialize database
const db = createDatabase('./data/reverso.db');

// Sync schema from scanner
await syncSchema(db, projectSchema);

// Query data
const pages = await getPages(db);
const content = await getContent(db, 'home.hero.title');
```

## Features

- **SQLite Support**: Uses better-sqlite3 for local development
- **Drizzle ORM**: Type-safe queries and migrations
- **CMS Tables**: pages, sections, fields, content, media
- **Auth Tables**: users, sessions (Better Auth compatible)
- **Content History**: Track changes with audit trail

## Documentation

See [https://reverso.dev/docs/packages/db](https://reverso.dev/docs/packages/db)

## License

MIT
