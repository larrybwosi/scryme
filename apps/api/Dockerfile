# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates. Slim needs more build tools than alpine for some native modules if they were used,
# but for runtime it's generally fine.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm (aligned with version 10.33.0)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ---------------------------------------------------------
# Stage 2: Pruner (Turborepo)
# ---------------------------------------------------------
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune api --docker

# ---------------------------------------------------------
# Stage 3: Installer & Builder
# ---------------------------------------------------------
FROM base AS installer
WORKDIR /app

# Copy the pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install all dependencies securely
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds --ignore-scripts

# Copy full source code and turbo configuration
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma Client
RUN npx turbo run generate

# Build the API and its internal workspace dependencies
RUN npx turbo build --filter=api...

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

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
COPY --from=installer --chown=nestjs:nodejs /app/packages/database/prisma ./prisma

# Copy entrypoint script safely from the pruned context
COPY --from=pruner --chown=nestjs:nodejs /app/apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v2/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main"]
