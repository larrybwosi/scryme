# Scryme Admin Dashboard (`apps/admin`)

The Scryme Admin App is a Next.js application providing central management capabilities across organizations, users, billing, system settings, and integrations within the Scryme ERP platform.

---

## 🚀 Deployment Guide

This guide covers building, deploying, and connecting the Admin App container to the system PostgreSQL database (`@repo/db`).

---

## 1. Environment Variables

The Admin App requires the following runtime environment variables:

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection URL used by `@repo/db` (Prisma) |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://api.scryme.tech` | Base URL of the Scryme API service |
| `NEXT_PUBLIC_ADMIN_URL` | **Yes** | `http://localhost:3007` | Public-facing URL of this Admin App |
| `BETTER_AUTH_SECRET` | **Yes** | - | Shared secret key for Better Auth session encryption |
| `BETTER_AUTH_URL` | Optional | `http://localhost:3007` | Base authentication URL |
| `PORT` | Optional | `3007` | Internal server port for Next.js standalone server |

---

## 2. Connecting to the System PostgreSQL Database

The Admin App uses Server Actions and server-side utilities from `@repo/db` (Prisma ORM) to interact directly with the PostgreSQL database.

### Connection String Format
```bash
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?schema=public&sslmode=<SSL_MODE>"
```

### Deployment Scenarios

#### Scenario A: Same Docker Network (Stack Deployment)
When running alongside the main Scryme stack using Docker Compose, the database service is reachable by its container service name (`db` or `scryme-db`):

```bash
DATABASE_URL="postgresql://postgres:postgres_password@db:5432/app_db?schema=public"
```

Ensure the Admin App container belongs to the shared network (`scryme-network` or `scryme-prod-network`).

#### Scenario B: External PostgreSQL Database
If your system database is hosted on a managed database platform (such as AWS RDS, Supabase, Neon, or a dedicated database host):

1. **Format the Connection String**:
   ```bash
   DATABASE_URL="postgresql://admin_user:SecurePassword123!@db.example.com:5432/scryme_db?schema=public&sslmode=require"
   ```
2. **Network & Firewall Rules**:
   - Ensure inbound traffic on port `5432` (or custom Postgres port) is permitted from your Admin App container's public/private IP address.
   - If using cloud provider security groups (e.g., AWS Security Groups or GCP Firewall), grant ingress access to the Admin host IP.

#### Scenario C: Host Network / Port Forwarding
If the database runs on the Docker host machine directly and is published to `localhost:5438` or `localhost:5432`:

- **Linux**: Use host IP (e.g., `172.17.0.1` or `host.docker.internal` with `extra_hosts`).
- **macOS / Windows**: Use `host.docker.internal`:
  ```bash
  DATABASE_URL="postgresql://dbuser:dbpassword@host.docker.internal:5438/app_db?schema=public"
  ```

---

## 3. Database Permissions & Schema Requirements

The Admin App requires read and write permissions on the core schema managed by `@repo/db` (Prisma). Key models accessed include:
- `Organization`
- `User` & `Member`
- `IntegrationDefinition` & `OrganizationIntegration`
- `GlobalSetting`
- `Subscription` & Billing tables

Ensure the database user configured in `DATABASE_URL` has `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges on the `public` schema.

Database migrations are managed centrally via `@repo/db`. Deploy migrations prior to starting the Admin App:
```bash
pnpm --filter @repo/db run db:migrate:deploy
```

---

## 4. Running with Docker & Docker Compose

### Option 1: Standalone Deployment via `apps/admin/docker-compose.yml`

Navigate to `apps/admin` and start the container:

```bash
cd apps/admin
docker compose up -d
```

### Option 2: Main Ecosystem Deployment

Run the Admin App as part of the production stack from the repository root:

```bash
docker compose -f docker-compose.prod.yml up -d admin
```

### Option 3: Manual Docker Build & Run

```bash
# Build image from repository root
docker build -t scryme-admin:latest -f apps/admin/Dockerfile .

# Run container
docker run -d \
  --name scryme-admin \
  -p 3007:3007 \
  -e DATABASE_URL="postgresql://user:pass@db_host:5432/app_db?schema=public" \
  -e NEXT_PUBLIC_API_URL="https://api.scryme.tech" \
  -e NEXT_PUBLIC_ADMIN_URL="https://admin.scryme.tech" \
  -e BETTER_AUTH_SECRET="your-better-auth-secret" \
  scryme-admin:latest
```

---

## 5. Automated Release Images

When new releases are tagged in GitHub, the CI workflow (`.github/workflows/release.yml`) builds and publishes the Admin App container image to GitHub Container Registry:

```bash
ghcr.io/larrybwosi/scryme/admin:latest
ghcr.io/larrybwosi/scryme/admin:<VERSION>
```

To pull and run the release image:
```bash
docker pull ghcr.io/larrybwosi/scryme/admin:latest
```

---

## 6. Health Check & Troubleshooting

### Healthcheck
The container exposes a health check endpoint at `/api/health`:
```bash
curl http://localhost:3007/api/health
```
Response:
```json
{"status":"ok","timestamp":"2026-03-31T00:00:00.000Z"}
```

### Viewing Logs
```bash
docker logs -f scryme-admin
```

### Common Issues
- **Database Connection Refused**:
  - Check if `DATABASE_URL` host is reachable from inside the container (`docker exec -it scryme-admin ping <db_host>`).
  - Verify PostgreSQL is accepting connections on the specified port.
- **SSL / TLS Handshake Failure**:
  - Append `?sslmode=require` or `?sslmode=no-verify` to `DATABASE_URL` depending on your PostgreSQL provider's TLS requirements.
