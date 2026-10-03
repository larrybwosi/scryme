# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:22-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

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
RUN turbo prune cms --docker

# ---------------------------------------------------------
# Stage 3: Installer & Builder
# ---------------------------------------------------------
FROM base AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --dangerously-allow-all-builds --ignore-scripts

COPY --from=pruner /app/out/full/ .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-APP_NEXT_PUBLIC_API_URL_PLACEHOLDER}
ARG BETTER_AUTH_SECRET
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-fallback-secret-for-build}
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV PAYLOAD_SECRET="buildtime-payload-secret-key-must-be-32-chars-long"

RUN pnpm turbo run generate

RUN mkdir -p apps/cms/public

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=cms... --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/cms/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/cms/.next/static ./apps/cms/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/cms/public ./apps/cms/public

COPY --from=pruner --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
USER root
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-3010}

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "apps/cms/server.js"]
