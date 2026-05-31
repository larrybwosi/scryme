# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
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
RUN turbo prune web --docker

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

# Generate Prisma Client (if needed by Web)
RUN npx turbo run generate

# Build the Web app and its internal workspace dependencies
RUN npx turbo build --filter=web...

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create a system user to run the application securely
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

# Copy built outputs preserving workspace paths
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy entrypoint script
COPY --from=pruner --chown=nextjs:nodejs /app/apps/web/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
