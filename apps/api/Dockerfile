# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates.
# 💡 FIXED: Added wget here so the Stage 4 HEALTHCHECK actually works!
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
RUN turbo prune api --docker

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

# Generate Prisma Client
RUN pnpm turbo run generate

# Build the API and its internal workspace dependencies
# Limit memory and concurrency to reduce resource consumption
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=api... --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV NODE_OPTIONS="--max-old-space-size=768"

# Create a system user to run the application securely
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nestjs

# Install Prisma globally for migrations using pnpm to match base
RUN pnpm add -g prisma@7.8.0

# Set up pnpm and prisma engines permissions for the non-root user
RUN chown -R nestjs:nodejs /pnpm

# Copy node_modules and built outputs preserving workspace paths
COPY --from=installer --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

# Copy shared packages if your API depends on them
COPY --from=installer --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=installer --chown=nestjs:nodejs /app/packages/db/prisma ./prisma

# Copy entrypoint script safely from the pruned context
COPY --from=pruner /app/out/full/apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/api/v2/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main"]
