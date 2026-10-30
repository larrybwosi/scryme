# Multi-Instance & Shared Infrastructure Deployment Guide

This guide describes how to deploy multiple instances of the **Scryme Platform** (or individual applications like **CRM**, **CMS**, and **Admin**) on a single server or cluster, and how to configure shared infrastructure services (PostgreSQL, Redis, RabbitMQ) across applications and instances for optimal developer experience (DX) and resource utilization.

---

## 🏛️ Deployment Architecture & Networking

Scryme utilizes Docker networks to isolate environments while allowing application containers (`web`, `api`, `crm`, `cms`, `admin`, `bakery`) to connect directly to shared data services (`db`, `customer-db`, `redis`, `rabbitmq`).

```
                              ┌───────────────────────────────────┐
                              │    Reverse Proxy Network          │
                              │ (dokploy-network / coolify / etc) │
                              └─────────────────┬─────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌─────────────────────────┐            ┌─────────────────────────┐            ┌─────────────────────────┐
│ Instance 1 (scryme-a)   │            │ Instance 2 (scryme-b)   │            │ Standalone App Container│
│ Network: scryme-a-net   │            │ Network: scryme-b-net   │            │ Network: scryme-a-net   │
│ ├── db (5432)           │            │ ├── db (5432)           │            │ └── scryme-a-crm (3001) │
│ ├── redis (6379)        │            │ ├── redis (6379)        │            │   (Connects to db &     │
│ └── api (4000)          │            │ └── api (4000)          │            │    redis on scryme-a)  │
└─────────────────────────┘            └─────────────────────────┘            └─────────────────────────┘
```

---

## 1. Multi-Instance Deployments with `INSTANCE_NAME`

Every Docker Compose file in Scryme supports dynamic instance scoping using the `INSTANCE_NAME` environment variable.

### Key Instance Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `INSTANCE_NAME` | `scryme` | Prefix for container names and database volume namespaces |
| `SCRYME_NETWORK_NAME` | `${INSTANCE_NAME}-network` | Shared internal Docker bridge network for the instance |
| `PROXY_NETWORK_NAME` / `PROXY_NETWORK` | `dokploy-network` | External proxy network for SSL routing (Traefik / Nginx) |
| `PORT` / App Ports (`CRM_PORT`, `CMS_PORT`, `ADMIN_PORT`) | App default | Host port bindings when running multiple stacks on one host |

---

## 2. Shared vs. Dedicated Infrastructure Patterns

### Pattern A: Full Stack per Instance (Isolated DB & Redis)

When deploying completely isolated client environments on a single host:

```bash
# Instance A (e.g. Staging)
INSTANCE_NAME=scryme-staging \
SCRYME_NETWORK_NAME=scryme-staging-network \
API_PORT=4001 \
WEB_PORT=3000 \
CRM_PORT=3001 \
CMS_PORT=3010 \
ADMIN_PORT=3007 \
docker compose -p scryme-staging -f docker-compose.yml up -d

# Instance B (e.g. Production)
INSTANCE_NAME=scryme-prod \
SCRYME_NETWORK_NAME=scryme-prod-network \
API_PORT=4000 \
WEB_PORT=3002 \
CRM_PORT=3003 \
CMS_PORT=3011 \
ADMIN_PORT=3008 \
docker compose -p scryme-prod -f docker-compose.prod.yml up -d
```

### Pattern B: Shared Database & Redis across Applications (CRM, CMS, Admin)

To run central infrastructure (`db`, `customer-db`, `redis`, `rabbitmq`) and attach standalone applications (`apps/crm`, `apps/cms`, `apps/admin`):

1. **Start Primary Infrastructure**:
   ```bash
   INSTANCE_NAME=scryme \
   SCRYME_NETWORK_NAME=scryme-network \
   docker compose up -d db customer-db redis rabbitmq api
   ```

2. **Launch App Instances attached to Shared Infrastructure**:

   - **Scryme CRM (`apps/crm`)**:
     ```bash
     cd apps/crm
     INSTANCE_NAME=scryme \
     SCRYME_NETWORK_NAME=scryme-network \
     CRM_PORT=3001 \
     DATABASE_URL="postgresql://dbuser:dbpassword@db:5432/app_db?schema=public" \
     REDIS_URL="redis://redis:6379" \
     docker compose up -d
     ```

   - **Scryme CMS (`apps/cms`)**:
     ```bash
     cd apps/cms
     INSTANCE_NAME=scryme \
     SCRYME_NETWORK_NAME=scryme-network \
     CMS_PORT=3010 \
     DATABASE_URL="postgresql://dbuser:dbpassword@db:5432/app_db?schema=public" \
     REDIS_URL="redis://redis:6379" \
     docker compose up -d
     ```

   - **Scryme Admin (`apps/admin`)**:
     ```bash
     cd apps/admin
     INSTANCE_NAME=scryme \
     SCRYME_NETWORK_NAME=scryme-network \
     ADMIN_PORT=3007 \
     DATABASE_URL="postgresql://dbuser:dbpassword@db:5432/app_db?schema=public" \
     REDIS_URL="redis://redis:6379" \
     docker compose up -d
     ```

---

## 3. Network Configuration & Multi-Tenancy

Containers on the external `scryme-network` resolve shared services using standard Docker DNS names:

- **Primary DB**: `db:5432`
- **Customer DB**: `customer-db:5432`
- **Cache**: `redis:6379`
- **Queue**: `rabbitmq:5672`
- **API Engine**: `api:4000`

### Multi-Tenant Database Connection Pool Best Practices

When sharing a single PostgreSQL instance (`db`) across multiple apps (`api`, `web`, `crm`, `cms`, `admin`):

1. Set `connection_limit` parameters in `DATABASE_URL` (e.g., `?schema=public&connection_limit=10`).
2. Utilize PgBouncer or Prisma Accelerate for high concurrency setups.
3. Keep tenant isolation enforced at the database query level via `@repo/db` Prisma extensions.

---

## 4. Verification & Healthchecks

Check health status of all running instances and containers:

```bash
# List all running containers across instances
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verify app health checks
curl http://localhost:4000/api/v2/health  # API
curl http://localhost:3001/api/health     # CRM
curl http://localhost:3010/api/health     # CMS
curl http://localhost:3007/api/health     # Admin
```
