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
RUN turbo prune mcp --docker

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

# Generate Prisma Client and Orval SDK
RUN pnpm turbo run generate

# Build the MCP app and its internal workspace dependencies
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=mcp... --concurrency=1

# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV SCRYME_MCP_TRANSPORT=stdio
ENV SCRYME_MCP_PORT=3001
ENV PORT=3001

# Create a system user to run the application securely
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs mcpser

COPY --from=installer --chown=mcpser:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=mcpser:nodejs /app/apps/mcp/dist ./apps/mcp/dist
COPY --from=installer --chown=mcpser:nodejs /app/apps/mcp/package.json ./apps/mcp/package.json

# Copy internal packages if mcp depends on them
COPY --from=installer --chown=mcpser:nodejs /app/packages/v3-sdk/dist ./packages/v3-sdk/dist
COPY --from=installer --chown=mcpser:nodejs /app/packages/v3-sdk/package.json ./packages/v3-sdk/package.json

# Copy entrypoint script safely from the pruner stage root
COPY --from=pruner --chown=mcpser:nodejs /app/entrypoint.sh ./entrypoint.sh
USER root
RUN chmod +x ./entrypoint.sh

USER mcpser

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "apps/mcp/dist/index.js"]
