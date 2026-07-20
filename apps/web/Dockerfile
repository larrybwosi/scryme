# ---------------------------------------------------------
# Stage 4: Runner (Production execution)
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Adjust Node heap memory to utilize available container memory
ENV NODE_OPTIONS="--max-old-space-size=614MB"

# Create a system user to run the application securely
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Prisma schema copies for server-side execution
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma ./prisma
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma/seed.ts ./prisma/seed.ts
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma.config.ts ./prisma.config.ts
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/package.json

COPY --from=pruner --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
USER root
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-3000}/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
