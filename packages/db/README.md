# `@repo/db`

The data access layer and core **Prisma Database Client** package for the Scryme ERP platform. It manages the global database schemas, migrations, PostgreSQL connection pooling singletons, PG query monkey-patches, and initial system data seeding.

## 🚀 Key Features

- **Modular Prisma Schema**: Organized database entities covering multi-tenancy, POS sessions, CRM metrics, and inventory batches.
- **Database Pooling & Resilience**:
  - Implements connection timeouts of `10000ms` (10 seconds) for higher resilience under serverless cold starts.
  - Custom PostgreSQL client and Prisma pool caching stored as a global Node.js singleton to eliminate connection leaks during hot-reloads.
- **Query Patches**: Automatically monkey-patches `pg.Client.prototype.query` to resolve standard Postgres double-value replication deprecation warnings.
- **Database Seeding**: Centralized seed scripts (`pnpm db:seed`) to securely bootstrap essential lookup values, configurations, and core administrative roles.

---

## 🛠️ Commands

Run these scripts from either the workspace root using filters, or directly within the `packages/db` directory:

- **`pnpm run generate`**: Regenerate the Prisma client types.
- **`pnpm run db:migrate:dev`**: Generate and apply a new Prisma database migration (development).
- **`pnpm run db:migrate:deploy`**: Apply pending migrations to the database (production).
- **`pnpm run db:seed`**: Execute the seed script against the active database.
- **`pnpm run studio`**: Open Prisma Studio interface.

---

## 💻 Usage

```typescript
import { db } from "@repo/db";

async function getUsers() {
  return db.user.findMany();
}
```
