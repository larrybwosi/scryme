# Scryme

Scryme is a professional, enterprise-grade Enterprise Resource Planning (ERP) platform tailored for retailers and wholesalers. It provides a unified ecosystem to manage inventory, sales, customers, and financial integrations through a modern, performant architecture.

## 🚀 The Scryme Ecosystem

Scryme is built as a monorepo using [Turborepo](https://turbo.build/), ensuring a cohesive developer experience, rapid builds, and seamless integration between its core applications and shared package modules:

### 📱 Applications (`apps/`)

Our application ecosystem contains specialized desktop, web, mobile, and service components:

- **[Scryme Web](./apps/web)**: The central Next.js ERP back-office management dashboard. Business owners use it to oversee suppliers, product configurations, organization locations, and in-depth analytics.
- **[Scryme API](./apps/api)**: The backend REST engine powered by NestJS. It coordinates business logic, data transactions, RabbitMQ queues, Redis caching, and real-time Ably events.
- **[Scryme CRM](./apps/crm)**: Specialized Next.js customer relationship management, loyalty configurations, contact segments, and automated workflow triggers.
- **[Scryme POS](./apps/pos)**: High-performance, offline-first Tauri v2 desktop checkout terminal (Rust + React). Optimizes product lookups and features native thermal printer, barcode scanner, and cash drawer support.
- **[Scryme Bakery](./apps/bakery)**: Specialized Tauri v2 production management terminal (Rust + React) for commercial bakeries, tracking recipes, batches, raw materials, and finished pastries.
- **[Scryme Customer Portal](./apps/portal)**: Client-facing Next.js portal enabling merchant customers to browse catalogs, handle shopping carts, track active orders, and view account statuses.
- **[Scryme Storefront & Marketing Site](./apps/site)**: The public landing page and public shopfront, powered by Next.js and Headless Sanity CMS.
- **[Scryme API Docs](./apps/docs)**: Light, static Vite-based OpenAPI documentation explorer hosting and presenting Scryme's RESTful API endpoints.
- **[Scryme Admin Web App](./apps/admin)**: Central Next.js administrative console for platform management, organization overrides, billing, and system configurations. See the **[Admin App Deployment Guide](./apps/admin/README.md)**.
- **[Scryme Admin Android App](./apps/android)**: Native Kotlin & Jetpack Compose mobile administrator dashboard for tracking real-time sales progress, active staff attendance polling, petty cash transactions, and broadcasting messages.
- **[Scryme MCP Server](./apps/mcp)**: Model Context Protocol (MCP) server securely exposing Scryme's catalog, inventory, and CRM endpoints to LLM tools (such as Claude Desktop or Cursor).

---

## 🔌 Connected Apps & Customer SSO
If you are developing connected applications or integrating a third-party portal to authenticate customers using our Single Sign-On (SSO), see our comprehensive:
- **[Customer Single Sign-On & Authentication Guide](./docs/customer-authentication.md)**
- **[Connected Apps & V3 Catalog Guide](./docs/v3-connected-apps-catalog.md)**
- **[Admin App Deployment & DB Guide](./docs/admin-deployment.md)**

---

### 📦 Shared Packages (`packages/`)

Our core logic, database client, configurations, and utilities are modularized into shared packages:

- **[`@repo/db`](./packages/db)**: The database layer wrapper enclosing the Prisma schema, PostgreSQL client singleton, and database seeding scripts.
- **[`@repo/auth`](./packages/auth)**: Shared identity and multi-tenant authorization utilities powered by Better Auth.
- **[`@repo/shared`](./packages/shared)**: General helper utilities, custom resilient Redis clients (with in-memory fallback), SSRF-blocking URL filters, M-PesaSTK pushes, and Ably real-time publishers.
- **[`@repo/ui`](./packages/ui)**: Unified React component library containing Radix UI accessible primitives, styled with Tailwind CSS v4, and housing custom global barcode scanner key-event filters.
- **[`@repo/documents`](./packages/documents)**: Clean PDF receipt, invoice, and balance sheet engines powered by React-PDF.
- **[`@repo/notifications`](./packages/notifications)**: Multi-channel messaging gateway orchestrating SMTP/Nodemailer HTML emails, handlebars template compiles, and SMS services.
- **[`@repo/chat`](./packages/scryme)**: Developer-centric API client mapping token exchange and message publishing against the Scryme Chat API.
- **[`@repo/sdk`](./packages/sdk)**: Central client SDK containing shared HTTP wrappers and pre-configured request interceptors.
- **[`@scryme/sdk`](./packages/v3-sdk)**: Rigorous TypeScript API client compiler generated directly from our core OpenAPI 3.0 specification.
- **[`@repo/env`](./packages/env)**: Type-safe runtime environment schema validation powered by Zod.
- **[`@repo/eslint-config`](./packages/config-eslint)**: Common ESLint linting configurations.
- **[`@repo/typescript-config`](./packages/config-typescript)**: Base strict TS configuration files for Next.js, Node services, and React libraries.
- **[`@repo/prettier-config`](./packages/config-prettier)**: Common Prettier code-formatting guidelines.

---

## 🛠️ Tech Stack

- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Desktop**: [Tauri v2](https://tauri.app/) (Rust + React)
- **Mobile**: Native Kotlin with Jetpack Compose
- **Backend**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) & SQLite with [Prisma ORM](https://prisma.io/)
- **Realtime**: [Ably](https://ably.com/)
- **Auth**: [Better Auth](https://better-auth.com/)
- **Package Management**: [pnpm](https://pnpm.io/)
- **Containerization**: [Docker Compose](https://docs.docker.com/compose/)

---

## 🏁 Getting Started (Development)

### Prerequisites

- **Node.js** (v22 or later)
- **pnpm** (v9+)
- **Docker** and **Docker Compose**
- **Rust** (v1.75+ for building POS and Bakery apps)
- **Android Studio** & **JDK 21** (for building the Android app)

### Setup Guide

1. **Clone the Repository**

   ```bash
   git clone https://github.com/larrybwosi/scryme.git
   cd scryme
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Start Infrastructure**
   Scryme uses Docker Compose for local development (PostgreSQL DB, Redis, RabbitMQ).

   ```bash
   docker compose up -d
   ```

4. **Environment Configuration**
   Copy `.env.example` to the relevant apps:

   ```bash
   cp .env.example .env # Root env
   cp apps/api/.env.example apps/api/.env
   # Repeat for other apps as needed
   ```

5. **Database Migration & Seeding**

   ```bash
   pnpm run db:migrate:dev
   pnpm run db:seed
   ```

6. **Run Development Mode**
   ```bash
   pnpm run dev
   ```
   This will start all applications in development mode.

---

## 🚢 Deployment

For production deployments, we support Docker-based setups for web services and native builds for desktop applications.

### Web & API (Docker)

We provide a production-ready Docker Compose configuration. Refer to the [Deployment Guide](./apps/api/README.md#deployment) for more details.

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Desktop Apps (Tauri)

To build the POS or Bakery applications for distribution:

```bash
cd apps/pos # or apps/bakery
pnpm tauri build
```

---

## 🤝 Contributing

We welcome contributions from the community! Please check out our [Contributing Guidelines](./CONTRIBUTING.md) (if available) or simply open a Pull Request.

---

## 📄 License

This repository is licensed under the GNU Affero General Public License version 3 (AGPL-3.0). Please see the [LICENSE](LICENSE) file for more information.

_Built for efficiency. Scaled for growth._
