FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
RUN apk add --no-capacity --no-cache libc6-compat
COPY . .
RUN pnpm --filter auth... build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/auth/dist /usr/share/nginx/html
COPY apps/auth/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4444
CMD ["nginx", "-g", "daemon off;"]
