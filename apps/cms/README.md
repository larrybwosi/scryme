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
