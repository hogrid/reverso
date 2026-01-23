# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with monorepo setup (Turborepo + pnpm)
- Package scaffolding for all core packages:
  - `@reverso/core` - Types, utilities, and configuration
  - `@reverso/scanner` - AST parser for detecting markers
  - `@reverso/db` - Database schema with Drizzle ORM
  - `@reverso/api` - Fastify server with REST and GraphQL
  - `@reverso/admin` - Admin panel with React and shadcn/ui
  - `@reverso/blocks` - Block editor components
  - `@reverso/forms` - Form system
  - `@reverso/cli` - Command-line interface
  - `@reverso/mcp` - MCP Server for AI integration
  - `create-reverso` - Project scaffolding CLI
- Documentation site scaffolding with Astro Starlight
- Playground app for development and demos
- CI/CD workflows for testing, releases, and documentation
- Contribution guidelines and code of conduct
- Changesets for version management

[Unreleased]: https://github.com/hogrid/reverso/commits/main
