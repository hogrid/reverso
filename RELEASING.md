# Releasing Reverso

This document describes the release process for Reverso packages.

## Prerequisites

- Node.js 20+
- pnpm 9+
- npm account with publish access to `@reverso` scope
- Git configured with commit signing (optional)

## Package Publishing Order

Due to package dependencies, packages should be published in this order:

1. `@reverso/core` (no internal dependencies)
2. `@reverso/scanner` (depends on core)
3. `@reverso/db` (depends on core)
4. `@reverso/blocks` (no internal dependencies)
5. `@reverso/forms` (no internal dependencies)
6. `@reverso/admin` (depends on blocks, forms)
7. `@reverso/api` (depends on core, db, admin)
8. `@reverso/mcp` (depends on db)
9. `@reverso/cli` (depends on core, scanner, api)
10. `create-reverso` (depends on cli)

## Release Workflow

### 1. Create a Changeset

After making changes, create a changeset to document what changed:

```bash
pnpm changeset
```

Follow the prompts to:
- Select which packages changed
- Choose version bump type (patch/minor/major)
- Write a summary of changes

This creates a markdown file in `.changeset/` that will be consumed during release.

### 2. Version Packages

When ready to release, consume all changesets and update versions:

```bash
pnpm changeset version
```

This will:
- Update `package.json` versions for all affected packages
- Update `CHANGELOG.md` files
- Remove consumed changeset files

Review the changes before committing.

### 3. Build All Packages

Ensure everything builds successfully:

```bash
pnpm build
```

### 4. Test

Run the full test suite:

```bash
pnpm test
pnpm typecheck
pnpm lint
```

### 5. Commit Version Changes

```bash
git add .
git commit -m "chore: release v0.x.x"
```

### 6. Publish to npm

```bash
pnpm changeset publish
```

This publishes all packages with updated versions to npm.

### 7. Push Tags

```bash
git push --follow-tags
```

## Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.0.x): Bug fixes, documentation updates
- **Minor** (0.x.0): New features, non-breaking changes
- **Major** (x.0.0): Breaking changes

During the 0.x phase, minor versions may include breaking changes.

## Pre-release Versions

For beta/alpha releases:

```bash
pnpm changeset pre enter beta
pnpm changeset version
pnpm changeset publish
pnpm changeset pre exit
```

## Troubleshooting

### "Unclean working tree" Error

Commit or stash changes before publishing:

```bash
git stash
pnpm changeset publish
git stash pop
```

### npm Auth Issues

Login to npm:

```bash
npm login --scope=@reverso
```

### Failed Publish

If a publish partially fails, you can retry individual packages:

```bash
pnpm --filter @reverso/core publish
```

## CI/CD Integration

The recommended CI workflow:

1. On PR: Run `pnpm changeset status` to verify changeset exists
2. On merge to main:
   - If changesets exist: Create a "Version Packages" PR
   - On version PR merge: Run `pnpm changeset publish`

See `.github/workflows/release.yml` for the automated workflow.
