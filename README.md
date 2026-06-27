# Scryme ERP Platform

Scryme is a professional, enterprise-grade Enterprise Resource Planning (ERP) platform tailored for retailers and wholesalers. It provides a unified ecosystem to manage inventory, sales, customers, and financial integrations through a modern, performant architecture.

## 🚀 The Scryme Ecosystem

Scryme is built as a monorepo using [Turborepo](https://turbo.build/), ensuring a cohesive developer experience and seamless integration between its core components:

### 📱 Applications

- **[Scryme Web](./apps/web)**: A powerful [Next.js](https://nextjs.org/) web application for back-office management. Business owners can manage inventory, view analytics, handle supplier relationships, and configure system-wide settings.
- **[Scryme API](./apps/api)**: A robust [NestJS](https://nestjs.com/) REST API that serves as the backbone of the platform, handling business logic, authentication, and data persistence.
- **[Scryme CRM](./apps/crm)**: Specialized application for managing customer relationships, loyalty programs, and automated marketing workflows.
- **[Scryme POS](./apps/pos)**: A high-performance, offline-first desktop application built with [Tauri](https://tauri.app/) and [React](https://react.dev/). Optimized for fast sales processing and peripheral support.
- **[Scryme Bakery](./apps/bakery)**: A dedicated Tauri desktop application for managing bakery production, recipes, and specialized inventory.

### 📦 Core Modules

- **Inventory & Stock Management**: Real-time tracking, variant support, batch tracking, and low-stock alerts.
- **CRM & Loyalty**: Comprehensive profiles, purchase history, and reward management.
- **Supplier & Procurement**: Manage relationships, track purchase orders, and streamline replenishment.
- **Financial Integrations**: Support for **M-Pesa** and other payment gateways.
- **Analytics & Reporting**: Detailed insights into sales performance and operational efficiency.

---

## 🛠️ Tech Stack

- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Desktop**: [Tauri v2](https://tauri.app/) (Rust + React)
- **Backend**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://prisma.io/)
- **Realtime**: [Ably](https://ably.com/)
- **Auth**: [Zitadel](https://zitadel.com/)
- **Package Management**: [pnpm](https://pnpm.io/)
- **Containerization**: [Docker Compose](https://docs.docker.com/compose/)

---

## 🏁 Getting Started (Development)

### Prerequisites

- **Node.js** (v22 or later)
- **pnpm** (v9+)
- **Docker** and **Docker Compose**
- **Rust** (v1.75+ for building POS and Bakery apps)

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
   Scryme uses Docker Compose for local development (DB, Redis, RabbitMQ).

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

## 🏗️ Monorepo Structure

```text
├── apps/
│   ├── api/          # NestJS REST API
│   ├── bakery/       # Bakery management desktop app
│   ├── crm/          # CRM web application
│   ├── pos/          # Point of Sale desktop app
│   └── web/          # ERP Dashboard web app
├── packages/
│   ├── auth/         # Shared authentication logic
│   ├── db/           # Prisma schema and client
│   ├── sdk/          # Unified TypeScript SDK
│   ├── ui/           # Shared React component library
│   └── ...           # Domain-specific shared packages
```

---

## 🤝 Contributing

We welcome contributions from the community! Please check out our [Contributing Guidelines](./CONTRIBUTING.md) (if available) or simply open a Pull Request.

---

## 📄 License

Individual applications may have different licenses. Please refer to the `README.md` in each app directory.

_Built for efficiency. Scaled for growth._
