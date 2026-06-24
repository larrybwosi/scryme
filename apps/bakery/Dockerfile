# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm (aligned with other apps)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate

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
RUN turbo prune bakery --docker

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

# Copy full source code
COPY --from=pruner /app/out/full/ .

# Build-time environment variables for Vite
ENV VITE_API_URL=APP_VITE_API_URL_PLACEHOLDER

# Generate Prisma Client
RUN pnpm turbo run generate

# Build the Bakery app
RUN pnpm turbo build --filter=bakery

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM nginx:alpine AS runner

# Copy the built static files from the installer stage
COPY --from=installer /app/apps/bakery/dist /usr/share/nginx/html

# Copy the Nginx configuration safely from the pruned context
COPY --from=pruner /app/out/full/apps/bakery/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script safely from the pruned context
COPY --from=pruner /app/out/full/apps/bakery/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
