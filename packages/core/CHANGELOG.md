# @reverso/core

## 0.1.0

### Minor Changes

- Initial release of Reverso CMS - The front-to-back headless CMS.

  ## Features

  ### @reverso/core
  - Type definitions for fields, schema, content, and configuration
  - Field type constants (35+ types including text, image, blocks, relations)
  - Configuration loader and validation
  - Utility functions for naming conventions and path handling

  ### @reverso/scanner
  - AST parser using ts-morph to detect `data-reverso-*` markers
  - Automatic schema generation from React/JSX components
  - Support for repeaters and flexible content

  ### @reverso/db
  - Drizzle ORM schema for SQLite (dev) and PostgreSQL (prod)
  - Database migrations system
  - Query functions for pages, content, fields, media, forms

  ### @reverso/api
  - Fastify REST API with full CRUD operations
  - Authentication with Better Auth (email/password, magic link, OAuth)
  - Media upload with image processing
  - Form submissions with webhook support
  - Security features: rate limiting, CSRF protection, input validation

  ### @reverso/admin
  - React + shadcn/ui admin panel
  - Visual page and content editor
  - Media library with drag-and-drop upload
  - Form builder interface
  - Real-time preview

  ### @reverso/blocks
  - Tiptap-based block editor
  - Rich text formatting (bold, italic, headings, lists)
  - Code blocks with syntax highlighting
  - Image and table support

  ### @reverso/forms
  - Form builder with 10 field types
  - Multi-step forms with progress indicator
  - Conditional field logic
  - Zod-based validation
  - Honeypot spam protection

  ### @reverso/cli
  - `reverso scan` - Scan codebase for markers
  - `reverso dev` - Development server with hot reload
  - `reverso build` - Production build
  - `reverso migrate` - Database migrations

  ### @reverso/mcp
  - MCP Server for AI integration (Claude, etc.)
  - Tools for content management, schema inspection, media handling

  ### create-reverso
  - Interactive CLI wizard for project setup
  - Framework support: Next.js, Vite, Astro
  - Database options: SQLite, PostgreSQL
