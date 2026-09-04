# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
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

# Install turbo globally to ensure reliable execution
RUN pnpm add -g turbo

# Copy full source first so turbo can analyze the monorepo structure
COPY . .

# Remove potentially conflicting build artifacts from the host
RUN rm -rf .turbo && rm -rf node_modules

# Run prune on docs
RUN turbo prune docs --docker

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

# Copy full source code
COPY --from=pruner /app/out/full/ .

# Build-time environment variables for Vite
ENV VITE_API_URL=APP_VITE_API_URL_PLACEHOLDER

# Generate Prisma Client / SDK TypeScript types
RUN pnpm turbo run generate

# Build the docs app
# Limit memory and concurrency to reduce resource consumption
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=docs --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3008

# Create a system user to run the application securely
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs appuser

# Copy the built static files and the server script from the installer/pruner stages
COPY --from=installer --chown=appuser:nodejs /app/apps/docs/dist ./dist
COPY --from=pruner --chown=appuser:nodejs /app/out/full/apps/docs/server.js ./server.js

# Copy entrypoint script safely from the pruner stage root
COPY --from=pruner --chown=appuser:nodejs /app/entrypoint.sh ./entrypoint.sh
USER root
RUN chmod +x ./entrypoint.sh

USER appuser

EXPOSE 3008

# Use built-in node to do healthcheck. Node is built-in and always available!
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3008) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
