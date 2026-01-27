# @reverso/api

REST API server for Reverso CMS using Fastify.

## Installation

```bash
npm install @reverso/api
```

## Usage

```typescript
import { createServer } from '@reverso/api';

const server = await createServer({
  database: './data/reverso.db',
  port: 4000,
});

await server.listen();
```

## Endpoints

- `GET /schema` - Get project schema
- `GET /pages` - List all pages
- `GET /pages/:slug` - Get page details
- `GET /content/:path` - Get content by path
- `PUT /content/:path` - Update content
- `GET /media` - List media files
- `POST /media` - Upload media

## Features

- **Fastify**: High-performance web framework
- **Security**: Rate limiting, CORS, CSRF protection, Helmet
- **Authentication**: Session-based auth with brute force protection
- **File Uploads**: Multipart handling with validation

## Documentation

See [https://reverso.dev/docs/packages/api](https://reverso.dev/docs/packages/api)

## License

MIT
