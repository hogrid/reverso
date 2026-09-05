# Reverso CMS Production Dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build
FROM node:22-alpine AS builder

# Install native build toolchain so better-sqlite3 (and any other native
# addons) can compile from source on alpine/musl, where prebuilt binaries
# are not always available.
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# --- Dependency layer (cached unless manifests/lockfile change) ---
# Copy ONLY the files needed to resolve and install dependencies first, so
# `pnpm install` is not re-run when only source code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/admin/package.json ./packages/admin/
COPY packages/blocks/package.json ./packages/blocks/
COPY packages/forms/package.json ./packages/forms/
COPY packages/scanner/package.json ./packages/scanner/
COPY packages/cli/package.json ./packages/cli/
COPY packages/mcp/package.json ./packages/mcp/

# Install dependencies (compiles better-sqlite3 against the toolchain above)
RUN pnpm install --frozen-lockfile

# --- Build layer (re-runs when source or tsconfig changes) ---
# Copy the root tsconfig and source only after deps are installed.
COPY tsconfig.json ./
COPY packages/ ./packages/

# Build all packages (admin dist + library dist outputs)
RUN pnpm build

# Prune dev dependencies (keeps the compiled better-sqlite3 native binding)
RUN pnpm prune --prod

# Stage 2: Production
FROM node:22-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Create non-root user
RUN addgroup -g 1001 -S reverso && \
    adduser -S reverso -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/migrations ./packages/db/migrations
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/admin/package.json ./packages/admin/
COPY --from=builder /app/packages/admin/dist ./packages/admin/dist
COPY --from=builder /app/packages/blocks/package.json ./packages/blocks/
COPY --from=builder /app/packages/blocks/dist ./packages/blocks/dist
COPY --from=builder /app/packages/forms/package.json ./packages/forms/
COPY --from=builder /app/packages/forms/dist ./packages/forms/dist
COPY --from=builder /app/packages/scanner/package.json ./packages/scanner/
COPY --from=builder /app/packages/scanner/dist ./packages/scanner/dist
COPY --from=builder /app/packages/cli/package.json ./packages/cli/
COPY --from=builder /app/packages/cli/dist ./packages/cli/dist
COPY --from=builder /app/packages/cli/bin ./packages/cli/bin
COPY --from=builder /app/packages/mcp/package.json ./packages/mcp/
COPY --from=builder /app/packages/mcp/dist ./packages/mcp/dist

# Create directories. `.reverso` holds the database and uploads: keep it on a
# volume so `docker run` without compose does not lose content on restart.
RUN mkdir -p /app/.reverso/uploads && chown -R reverso:reverso /app
VOLUME ["/app/.reverso"]

# Switch to non-root user
USER reverso

# Environment variables
ENV NODE_ENV=production
ENV REVERSO_PORT=3001
ENV REVERSO_HOST=0.0.0.0
ENV REVERSO_DB_PATH=/app/.reverso/reverso.db
# Uploads are written relative to the working directory (.reverso/uploads).
# Behind a reverse proxy (the normal case) client IPs come from X-Forwarded-*.
ENV REVERSO_TRUST_PROXY=true

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the production server (API + admin). The schema is loaded by running
# `reverso scan --api-url <this server> --api-key $REVERSO_API_KEY` from the
# project that holds the data-reverso markers.
CMD ["node", "packages/cli/bin/reverso.js", "start"]
