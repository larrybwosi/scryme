# Scryme Marketing CMS (`apps/cms`)

Multi-Tenant Organization Product Marketing Headless CMS powered by Payload 3.0 and Next.js App Router, using RustFS S3 for isolated asset storage.

## Features
- **Payload 3.0 Integration**: Embedded CMS with Lexical rich text editor and Postgres persistence.
- **Full Multi-Tenancy**: Tenant-scoped collections for Products, Campaigns, Pages, Banners, Testimonials, and Media.
- **RustFS S3 Bucket Isolation**: Assets stored in organization-specific buckets (`dealio-org-{orgId}`).
- **Session-based Tenant Authorization**: Row-level access control based on user session organization membership.
- **Enterprise Features**: Drafts, published states, content versioning, and localization support.

## Running Locally
```bash
pnpm --filter cms dev
```
Access the admin portal at `http://localhost:3010/admin`.


## 🌐 Multi-Instance & Shared Infrastructure Deployment

Scryme CMS supports standalone deployment or attaching to shared system infrastructure via Docker networks.

### Docker Compose Standalone / Multi-Instance

```bash
cd apps/cms
INSTANCE_NAME=scryme \
SCRYME_NETWORK_NAME=scryme-network \
CMS_PORT=3010 \
DATABASE_URL="postgresql://dbuser:dbpassword@db:5432/app_db?schema=public" \
REDIS_URL="redis://redis:6379" \
docker compose up -d
```

For detailed multi-tenant and multi-instance orchestration, consult the [Multi-Instance Deployment Guide](../../docs/multi-instance-deployment.md).
