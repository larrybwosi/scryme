# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package.json and lock file
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces to leverage Docker cache
COPY apps/bakery/package.json ./apps/bakery/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/windmill/package.json ./packages/windmill/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/documents/package.json ./packages/documents/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---------------------------------------------------------

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Set placeholders for build time
ENV VITE_API_URL=APP_VITE_API_URL_PLACEHOLDER

# Install pnpm
RUN npm install -g pnpm

# Copy node_modules from deps stage
COPY --from=deps /app ./

# Copy the rest of the application code
COPY . .

# Build dependencies first
RUN pnpm --filter @repo/db build
RUN pnpm --filter @repo/shared build
RUN pnpm --filter @repo/sdk build

# Build the bakery app
RUN pnpm --filter bakery type-check
RUN pnpm --filter bakery build

# ---------------------------------------------------------

# Stage 3: Runner
FROM nginx:alpine AS runner

# Copy the built static files from the builder stage
COPY --from=builder /app/apps/bakery/dist /usr/share/nginx/html

# Copy the Nginx configuration
COPY apps/bakery/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY apps/bakery/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
