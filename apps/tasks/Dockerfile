# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends     openssl     ca-certificates     && rm -rf /var/lib/apt/lists/*

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
RUN rm -rf .turbo && rm -rf node_modules
RUN turbo prune tasks --docker

# ---------------------------------------------------------
# Stage 3: Installer & Builder
# ---------------------------------------------------------
FROM base AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store     pnpm config set store-dir /pnpm/store &&     pnpm install --frozen-lockfile --dangerously-allow-all-builds --ignore-scripts

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run generate

ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN --mount=type=cache,id=turbo,target=/app/.turbo     pnpm turbo build --filter=tasks --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Nginx Web Server)
# ---------------------------------------------------------
FROM nginx:alpine AS runner
WORKDIR /app

ENV PORT=3009

COPY --from=installer /app/apps/tasks/dist /usr/share/nginx/html
COPY apps/tasks/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=pruner /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=10s --retries=3   CMD wget --no-verbose --tries=1 --spider http://localhost:3009/

ENTRYPOINT ["./entrypoint.sh"]
