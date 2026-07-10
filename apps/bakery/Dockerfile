# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

# Prisma needs openssl, and ca-certificates.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# FIXED: Install pnpm safely via npm (aligned with version 10.34.1)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.34.1

# ---------------------------------------------------------
# Stage 2: Pruner (Turborepo)
# ---------------------------------------------------------
FROM base AS pruner
WORKDIR /app

# OPTIMIZATION: Install turbo globally to ensure reliable execution
RUN pnpm add -g turbo

# Copy full source first so turbo can analyze the monorepo structure
COPY . .

# Remove potentially conflicting build artifacts from the host
RUN rm -rf .turbo && rm -rf node_modules

# change "bakery" below to match that exact name.
RUN turbo prune bakery --docker

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

# Generate Prisma Client
RUN pnpm turbo run generate

# Build the Bakery app
# Limit memory and concurrency to reduce resource consumption
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=bakery --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM nginx:alpine AS runner

# FIXED: Install wget in Alpine so the HEALTHCHECK actually works
RUN apk add --no-cache wget

# Copy the built static files from the installer stage
COPY --from=installer /app/apps/bakery/dist /usr/share/nginx/html

# Copy the Nginx configuration safely from the pruned context
COPY --from=pruner /app/out/full/apps/bakery/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script safely from the pruner stage root
COPY --from=pruner /app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3003}/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
