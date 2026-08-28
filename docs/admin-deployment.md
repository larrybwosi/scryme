# Admin App Deployment & System Database Connection Guide

For detailed instructions on containerizing, deploying, and connecting the Admin App (`apps/admin`) to the system PostgreSQL database (`@repo/db`), please refer to the primary guide in the Admin App directory:

👉 **[Scryme Admin App Deployment Guide](../apps/admin/README.md)**

---

## Quick Summary

- **Dockerfile**: Located at `apps/admin/Dockerfile`
- **Docker Compose**: Standalone `apps/admin/docker-compose.yml` or production stack `docker-compose.prod.yml`
- **Release Image**: `ghcr.io/larrybwosi/scryme/admin:latest`
- **Port**: `3007`
- **Healthcheck**: `GET /api/health`
- **Required ENV**: `DATABASE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `BETTER_AUTH_SECRET`
