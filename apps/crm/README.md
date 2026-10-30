# Scryme CRM

**Scryme CRM** is a dedicated application within the Scryme ecosystem focused on Customer Relationship Management and loyalty automation.

## 🚀 Features

- **Loyalty Program Management**: Define tiers, point systems, and reward rules.
- **Customer Segmentation**: Group customers based on purchase behavior and demographics.
- **Marketing Automation**: Trigger-based notifications and promotional campaigns.
- **Interaction History**: Centralized log of all customer touchpoints across POS and Web.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)

---

## 🏁 Development Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Ensure `DATABASE_URL` and `NEXT_PUBLIC_API_URL` are set.

3. **Run App**
   ```bash
   pnpm --filter crm dev
   ```

---

## 🚢 Deployment

### Docker

```bash
docker build -t scryme-crm -f apps/crm/Dockerfile .
docker compose -f docker-compose.prod.yml up -d crm
```


---

## 🌐 Multi-Instance & Shared Infrastructure Deployment

Scryme CRM can be deployed as part of the primary stack or standalone attached to a shared database and Redis cluster.

### Docker Compose Standalone / Multi-Instance

```bash
cd apps/crm
INSTANCE_NAME=scryme \
SCRYME_NETWORK_NAME=scryme-network \
CRM_PORT=3001 \
DATABASE_URL="postgresql://dbuser:dbpassword@db:5432/app_db?schema=public" \
REDIS_URL="redis://redis:6379" \
docker compose up -d
```

For full multi-instance architecture instructions, see [Multi-Instance & Shared Infrastructure Guide](../../docs/multi-instance-deployment.md).
