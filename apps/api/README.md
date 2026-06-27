# Scryme API

The **Scryme API** is a robust, enterprise-grade [NestJS](https://nestjs.com/) REST API that serves as the backbone of the Scryme ERP Platform. It handles business logic, authentication via Zitadel, data persistence with PostgreSQL & Prisma, and real-time events.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple organizations and branches.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions managed through Zitadel.
- **Inventory Management**: Complex stock tracking, transfers, and reconciliation.
- **Financial Integrations**: M-Pesa STK push and payment processing.
- **Real-time Notifications**: Integrated with Ably for live updates to POS and Bakery apps.
- **Background Jobs**: Asynchronous task processing using RabbitMQ.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Cache/Queue**: [Redis](https://redis.io/) & [RabbitMQ](https://www.rabbitmq.com/)
- **Auth**: [Zitadel](https://zitadel.com/)
- **Validation**: [Zod](https://zod.dev/)

---

## 🏁 Development Setup

### Prerequisites

- Node.js v22+
- pnpm v9+
- Docker (for local infrastructure)

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

   Fill in your database credentials and Zitadel configuration.

3. **Database Setup**

   ```bash
   pnpm run db:migrate:dev
   pnpm run db:seed
   ```

4. **Run API**
   ```bash
   pnpm dev
   # or specifically
   pnpm --filter api dev
   ```

---

## 🚢 Deployment

### Docker (Recommended)

The API is containerized and ready for production.

1. **Build the Image**

   ```bash
   docker build -t scryme-api -f apps/api/Dockerfile .
   ```

2. **Run with Docker Compose**
   Use the `docker-compose.prod.yml` in the root directory. Ensure you have the appropriate images tagged or built.
   ```bash
   docker compose -f docker-compose.prod.yml up -d api
   ```

### Environment Variables for Production

Ensure the following variables are set in your production environment:

| Variable            | Description                        |
| :------------------ | :--------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string       |
| `ZITADEL_API_URL`   | Your Zitadel domain                |
| `ZITADEL_CLIENT_ID` | Zitadel application client ID      |
| `REDIS_URL`         | Redis connection URL               |
| `RABBITMQ_URL`      | RabbitMQ connection URL            |
| `JWT_SECRET`        | Secret for signing internal tokens |

---

## 🔌 API Documentation

Once the API is running, you can access the Swagger documentation at:
`http://localhost:3002/api/docs` (default development port)
