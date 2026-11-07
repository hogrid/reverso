# Reverso CMS production image: API + admin, served by `reverso start`.
#
# Build:  docker build -t reverso .
# Run:    docker run -p 3001:3001 -e REVERSO_COOKIE_SECRET=$(openssl rand -hex 32) \
#           -v reverso-data:/app/.reverso reverso
#
# The image is built with `pnpm deploy`, which copies @reverso/cli together
# with every production dependency it needs (workspace packages included) into
# one self-contained directory. The runtime stage therefore does not depend on
# the monorepo layout or on pnpm's symlinked node_modules.

# ---------------------------------------------------------------------------
# Stage 1: build every package and assemble the deployable CLI
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Native toolchain for better-sqlite3 (prebuilt binaries are not always
# available for alpine/musl).
RUN apk add --no-cache python3 make g++

# corepack picks the pnpm version pinned in package.json#packageManager.
RUN corepack enable

WORKDIR /app

# Dependency layer: manifests + lockfile only, so `pnpm install` is cached
# until a dependency changes. Every workspace member must be present for the
# frozen lockfile to validate, even the ones we do not ship.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/admin/package.json packages/admin/
COPY packages/api/package.json packages/api/
COPY packages/blocks/package.json packages/blocks/
COPY packages/cli/package.json packages/cli/
COPY packages/client/package.json packages/client/
COPY packages/core/package.json packages/core/
COPY packages/create-reverso/package.json packages/create-reverso/
COPY packages/db/package.json packages/db/
COPY packages/forms/package.json packages/forms/
COPY packages/mcp/package.json packages/mcp/
COPY packages/scanner/package.json packages/scanner/
COPY apps/docs/package.json apps/docs/
COPY apps/playground/package.json apps/playground/
COPY examples/blog/package.json examples/blog/
COPY examples/portfolio/package.json examples/portfolio/
COPY examples/showcase/package.json examples/showcase/

# Install only what the CLI (and its workspace dependencies) need to build.
RUN pnpm install --frozen-lockfile --filter "@reverso/cli..."

# Build layer: sources change more often than dependencies.
COPY tsconfig.json tsconfig.build.json ./
COPY packages/ packages/

RUN pnpm exec turbo run build --filter="@reverso/cli..."

# Assemble a standalone copy of the CLI with production dependencies only.
# Workspace packages are copied by their `files` field (dist, bin, migrations).
RUN pnpm --filter @reverso/cli deploy --prod /deploy

# ---------------------------------------------------------------------------
# Stage 2: runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS production

RUN addgroup -g 1001 -S reverso && \
    adduser -S reverso -u 1001

WORKDIR /app

# The deployable CLI lives next to the data directory, never inside it, so the
# `.reverso` volume only ever holds the database and uploads.
COPY --from=builder --chown=reverso:reverso /deploy /app/cms

# `.reverso` holds the database and uploads: keep it on a volume so
# `docker run` without compose does not lose content on restart.
RUN mkdir -p /app/.reverso/uploads && chown -R reverso:reverso /app/.reverso
VOLUME ["/app/.reverso"]

USER reverso

ENV NODE_ENV=production
ENV REVERSO_PORT=3001
ENV REVERSO_HOST=0.0.0.0
ENV REVERSO_DB_PATH=/app/.reverso/reverso.db
# Uploads are written relative to the working directory (.reverso/uploads).
#
# Not set here on purpose: REVERSO_TRUST_PROXY (only enable it behind a
# reverse proxy that strips client-sent X-Forwarded-* headers) and
# REVERSO_ALLOW_BOOTSTRAP (set it to true while creating the first admin; in a
# container the server cannot tell a local request from a remote one).

EXPOSE 3001

# IPv4 literal: on alpine `localhost` may resolve to ::1 first while the server
# listens on 0.0.0.0, and busybox wget does not fall back.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1

# The schema is loaded by running `reverso scan --api-url <this server>
# --api-key $REVERSO_API_KEY` from the project that holds the markers.
CMD ["node", "cms/bin/reverso.js", "start"]
