# ---------------------------------------------------------
# Stage 1: Base Image & Package Manager Setup
# ---------------------------------------------------------
FROM node:24-slim AS base

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
RUN turbo prune @repo/db --docker

# ---------------------------------------------------------
# Stage 3: Installer & Generator
# ---------------------------------------------------------
FROM base AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --dangerously-allow-all-builds --ignore-scripts

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run generate

# ---------------------------------------------------------
# Stage 4: Runner
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5555

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs studio

RUN mkdir -p /pnpm && chown -R studio:nodejs /pnpm

COPY --from=installer --chown=studio:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=studio:nodejs /app/packages/db ./packages/db
COPY --from=installer --chown=studio:nodejs /app/packages/env ./packages/env
COPY --from=installer --chown=studio:nodejs /app/package.json ./package.json

USER studio

EXPOSE 5555

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5555} || exit 1

WORKDIR /app/packages/db

CMD ["pnpm", "exec", "prisma", "studio", "--port", "5555", "--hostname", "0.0.0.0", "--browser", "none"]
