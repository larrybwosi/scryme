# Scryme Web (ERP Dashboard)

**Scryme Web** is the central management dashboard for the Scryme ERP Platform. Built with [Next.js](https://nextjs.org/), it provides business owners and managers with powerful tools to oversee their entire operation.

## 🚀 Features

- **Inventory Dashboard**: Real-time stock levels, low-stock alerts, and batch tracking.
- **Supplier Management**: Track supplier relationships, purchase orders, and deliveries.
- **CRM Interface**: View customer profiles, loyalty points, and purchase history.
- **Analytics & Reporting**: Interactive charts and detailed reports on sales and revenue.
- **Organization Settings**: Configure business details, locations, and user permissions.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest) & Axios
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## 🏁 Development Setup

### Prerequisites

- Node.js v22+
- pnpm v9+

### Steps

1. **Install Dependencies** (from the monorepo root)
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to your running Scryme API.

3. **Run Development Server**
   ```bash
   pnpm dev
   # or specifically
   pnpm --filter web dev
   ```

---

## 🚢 Deployment

### Docker (Recommended)

The Web application is optimized for standalone Docker deployments.

1. **Build the Image**
   ```bash
   docker build -t scryme-web -f apps/web/Dockerfile .
   ```

2. **Run with Docker Compose**
   ```bash
   docker compose -f docker-compose.prod.yml up -d web
   ```

### Vercel / Static Hosting

While containerization is recommended for full ERP features (including server actions), it can also be deployed to Vercel:

```bash
pnpm build
```

---

## 🏗️ Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable React components.
- `hooks/`: Custom React hooks for data fetching and logic.
- `lib/`: Utility functions and shared logic.
