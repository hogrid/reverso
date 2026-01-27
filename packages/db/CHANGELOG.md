# @reverso/db

## 0.1.12

### Patch Changes

- feat(admin): redesign UI with Notion-inspired white theme

  ### @reverso/admin

  - Redesigned UI with clean, modern Notion-inspired white theme
  - Added stagger animations to LoginPage for smoother UX
  - Fixed auth store API_BASE endpoint configuration
  - Added canRegister state for WordPress-like first-time setup flow
  - Improved Button, Input, Card, and ThemeToggle components
  - Better contrast and accessibility in color system

  ### @reverso/api

  - Added `/auth/setup-status` endpoint for setup detection
  - Updated `/auth/register` to only allow registration when no users exist
  - Improved error responses with proper 401 status codes

  ### @reverso/cli

  - Improved dev server messaging with clearer setup instructions
  - Added admin credentials display on first-time setup
  - Fixed lint issues and added biome.json configuration

  ### @reverso/db

  - Exported `getFirstUser` helper function for setup detection

## 0.1.11

### Patch Changes

- ### @reverso/admin

  - **BREAKING**: Redesigned UI with Notion-inspired clean white theme
  - Refined color system with better contrast and subtle accents
  - Added stagger animations to LoginPage
  - Fixed auth store API_BASE (was pointing to wrong endpoint)
  - Added `canRegister` state for WordPress-like registration flow
  - Improved Button, Input, Card, and ThemeToggle components

  ### @reverso/api

  - Added `/auth/setup-status` endpoint for setup detection
  - Updated `/auth/register` to only allow registration when no users exist (WordPress-like)
  - Fixed auth routes to return 401 correctly in production

  ### @reverso/cli

  - Improved dev server messaging with clearer setup instructions
  - Added admin credentials display on first-time setup

  ### @reverso/db

  - Exported `getFirstUser` helper function for setup detection

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

### Patch Changes

- Updated dependencies
  - @reverso/core@0.1.0
