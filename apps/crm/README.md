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
- **Integration**: [Zitadel](https://zitadel.com/) for customer authentication.

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
