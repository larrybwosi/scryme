# Scryme ERP Platform

Scryme is a professional, enterprise-grade Enterprise Resource Planning (ERP) platform tailored for retailers and wholesalers. It provides a unified ecosystem to manage inventory, sales, customers, and financial integrations through a modern, performant architecture.

## 🚀 The Scryme Ecosystem

Scryme is built as a monorepo using [Turborepo](https://turbo.build/), ensuring a cohesive developer experience and seamless integration between its core components:

### 📱 Applications

- **Scryme Web (ERP Dashboard)**: A powerful [Next.js](https://nextjs.org/) web application for back-office management. Business owners can manage inventory, view analytics, handle supplier relationships, and configure system-wide settings.
- **Scryme POS (Point of Sale)**: A high-performance, offline-first desktop application built with [Tauri](https://tauri.app/) and [React](https://react.dev/). Optimized for fast sales processing, peripheral support (printers, scanners), and resilient operations.
- **Scryme API**: A robust [NestJS](https://nestjs.com/) REST API that serves as the backbone of the platform, handling business logic, authentication, and data persistence.

### 📦 Core Modules

- **Inventory & Stock Management**: Real-time tracking across multiple locations, support for product variants, batch tracking, and low-stock alerts.
- **Customer Relationship Management (CRM)**: Comprehensive customer profiles, purchase history tracking, and loyalty program management.
- **Supplier & Procurement**: Manage supplier relationships, track purchase orders, and streamline inventory replenishment.
- **Financial Integrations**: Native support for **M-Pesa** and other payment methods to ensure smooth transaction flows.
- **Analytics & Reporting**: Detailed insights into sales performance, revenue trends, and operational efficiency.

---

## 🛠️ Tech Stack

- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Desktop**: [Tauri](https://tauri.app/) (Rust + React)
- **Backend**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://prisma.io/)
- **Package Management**: [pnpm](https://pnpm.io/)
- **Containerization**: [Docker Compose](https://docs.docker.com/compose/)

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **pnpm** (v9+)
- **Docker** and **Docker Compose**
- **Rust** (for building Scryme POS)

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

3. **Start the Infrastructure**
   Scryme uses Docker Compose to manage the PostgreSQL database.
   ```bash
   docker-compose up -d
   ```

4. **Environment Configuration**
   Copy `.env.example` to the relevant packages:
   ```bash
   cp .env.example ./packages/db/.env
   cp .env.example ./apps/api/.env
   cp .env.example ./apps/web/.env
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

## 🏗️ Monorepo Structure

```text
├── apps/
│   ├── api/          # NestJS REST API
│   ├── pos/          # Tauri Desktop POS application
│   └── web/          # Next.js ERP Dashboard
├── packages/
│   ├── auth/         # Shared authentication logic
│   ├── crm/          # Customer management logic
│   ├── db/           # Prisma schema and client
│   ├── mpesa/        # M-Pesa integration services
│   ├── shared/       # Common utilities and types
│   ├── ui/           # Shared React component library
│   └── ...           # Additional domain-specific packages
```

---

## 📄 License

This project's licensing information can be found in the respective application directories.

## 📞 Support

For enterprise inquiries or technical support, please contact the Scryme team.

_Built for efficiency. Scaled for growth._
