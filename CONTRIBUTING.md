# Contributing to Reverso

Thank you for your interest in contributing to Reverso! This document provides guidelines for contributing.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/reverso.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feat/my-feature`
5. Make your changes
6. Run tests: `pnpm test`
7. Run linting: `pnpm lint`
8. Commit with conventional commits
9. Push and open a Pull Request

## Development Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add image field validation
fix: resolve scanner crash on empty files
docs: update installation guide
```

## Pull Request Process

1. Ensure CI passes (lint, typecheck, tests, build)
2. Add a changeset if your changes affect published packages: `pnpm changeset`
3. Update documentation if needed
4. Request review from a maintainer
5. One approval required for merge

## Adding a Changeset

When you make changes that should be published:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages are affected
2. Choose the semver bump type (patch, minor, major)
3. Write a summary of changes

## Project Structure

```
reverso/
├── packages/           # Published packages
│   ├── core/          # @reverso/core
│   ├── scanner/       # @reverso/scanner
│   ├── db/            # @reverso/db
│   ├── api/           # @reverso/api
│   ├── admin/         # @reverso/admin
│   ├── blocks/        # @reverso/blocks
│   ├── forms/         # @reverso/forms
│   ├── cli/           # @reverso/cli
│   ├── mcp/           # @reverso/mcp
│   └── create-reverso/ # create-reverso
├── apps/              # Applications
│   ├── docs/          # Documentation site
│   └── playground/    # Interactive demo
└── examples/          # Example projects
```

## Code Style

- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `pnpm lint:fix` to auto-fix issues
- Run `pnpm format` to format code

## Testing

- Write tests for new features and bug fixes
- Use Vitest for unit and integration tests
- Use Playwright for E2E tests
- Aim for good coverage, especially in core packages

## Questions?

- Open a [Discussion](https://github.com/hogrid/reverso/discussions)
- Join our [Discord](https://discord.gg/reverso)

Thank you for contributing!
