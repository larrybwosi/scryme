# Scryme Customer Portal

**Scryme Customer Portal** is a Next.js web application designed to provide a secure, personalized customer and client interface. Within the portal, authenticated or public users can browse organization-scoped catalogs, manage shopping carts, track active and historical orders, and manage account details.

## 🚀 Key Features

- **Multi-Tenant Routing**: Dynamically scopes catalogs, orders, and sessions via subpaths (`/[orgSlug]`).
- **Product Catalog Browsing**: View and search available items, categories, and inventory configurations.
- **Cart & Checkout Flow**: Add items to a shopping cart and check out securely.
- **Order Tracking**: Real-time order status updates and historical purchase tracking.
- **Self-Service Account Management**: Update profiles, view loyalty tiers, and manage delivery or billing addresses.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: Client-side states for shopping carts.
- **Auth**: Built on top of `@repo/auth` / [Better Auth](https://better-auth.com/).

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v22 or later
- **pnpm** v9 or later

### Setup Instructions

1. **Install Dependencies**
   From the monorepo root:
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Create a local configuration by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to the running NestJS API service.

3. **Run the Portal**
   Start the local development server on port `3006`:
   ```bash
   pnpm --filter portal dev
   ```

---

## 🚢 Deployment

To build and run the production server locally or within Docker containers:

```bash
# Build the application
pnpm --filter portal build

# Start the production server
pnpm --filter portal start
```

### Docker
```bash
docker build -t scryme-portal -f apps/portal/Dockerfile .
```
