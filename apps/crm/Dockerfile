# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm safely via npm (aligned with version 10.34.1)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.34.1

# ---------------------------------------------------------
# Stage 2: Pruner (Turborepo)
# ---------------------------------------------------------
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
# Remove potentially conflicting build artifacts from the host
RUN rm -rf .turbo && rm -rf node_modules
# Run prune
RUN turbo prune crm --docker

# ---------------------------------------------------------
# Stage 3: Installer & Builder
# ---------------------------------------------------------
FROM base AS installer
WORKDIR /app

# Copy the pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install all dependencies securely using cache mounts
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --dangerously-allow-all-builds --ignore-scripts

# Copy full source code and turbo configuration
COPY --from=pruner /app/out/full/ .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3002}
ARG BETTER_AUTH_SECRET
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-fallback-secret-for-build}
# Provide a dummy DATABASE_URL for build time validation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Generate Prisma Client (if needed by CRM)
RUN pnpm turbo run generate

# Ensure public directory exists to prevent COPY failure in runner stage
RUN mkdir -p apps/crm/public

# Build the CRM and its internal workspace dependencies
# Limit memory and concurrency to reduce resource consumption
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=crm... --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV NODE_OPTIONS="--max-old-space-size=384"

# Create a system user to run the application securely
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

# Copy built outputs preserving workspace paths
COPY --from=installer --chown=nextjs:nodejs /app/apps/crm/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/crm/.next/static ./apps/crm/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/crm/public ./apps/crm/public

# CRITICAL: Next.js standalone needs the Prisma schema/engines explicitly available if imported
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma ./prisma
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma/seed.ts ./prisma/seed.ts
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma.config.ts ./prisma.config.ts
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/package.json

# Copy entrypoint script safely from the pruner stage root
COPY --from=pruner --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
USER root
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-3000}/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "apps/crm/server.js"]
