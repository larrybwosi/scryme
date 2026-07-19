# Database Migrations Guide

To ensure high availability, prevent data loss, and avoid breaking changes in production or for other team members, **every schema change in this package must be accompanied by a proper database migration**.

---

## 🚀 Step-by-Step Workflow for Contributors

Whenever you make any changes to the Prisma schema files located under `packages/db/prisma/schema/`:

### 1. Update the Prisma Schema
Modify the relevant `.prisma` files under `packages/db/prisma/schema/` (e.g., adding models, updating fields, or setting up relations).

### 2. Run your local database
Ensure you have a running local PostgreSQL instance. You can start the dev stack by running from the repository root:
```bash
pnpm start:dev
# Or run docker-compose directly:
# docker compose -f docker-compose.dev.yml up -d
```

### 3. Generate the Migration
Run the following command from the root of the monorepo to generate a SQL migration file automatically based on your schema changes:
```bash
pnpm --filter @repo/db exec prisma migrate dev --name your_migration_name
```
This command will:
- Compare your current schema files with the database.
- Generate a new migration directory containing `migration.sql` in `packages/db/prisma/migrations/`.
- Apply the migration to your local database.
- Generate the updated Prisma Client.

### 4. Commit the Migration
Commit the newly generated migration directory (`packages/db/prisma/migrations/<timestamp>_your_migration_name/migration.sql`) along with your updated schema files. **Do not modify or commit without this migration.**

---

## ⚠️ Guidelines to Avoid Breaking Changes

To ensure we never break production environments or other developers' local setups, adhere to the following best practices:

### 1. Column Additions on Existing Tables
- **Avoid non-nullable (required) columns without defaults.** If you add a new column to an existing table, it must either be **optional (nullable)** or have a **default value** (`@default(...)`).
- Adding a mandatory column without a default will cause queries and inserts on existing data to fail during deployment.

### 2. Renaming Tables or Columns
- **Prisma's `migrate dev` command treats renaming as a "drop and recreate" operation.** This will lead to complete data loss for that column or table in production.
- **Safe Renaming Pattern (Expansion-Contraction):**
  1. Add the new column/table as optional.
  2. Write a data migration script to copy data from the old field to the new field.
  3. Update application code to write to both and read from the new field.
  4. In a subsequent release, remove the old field/table.

### 3. Schema & Migration Status Checks
Before submitting a pull request, verify that your schema and migrations are fully in sync by running:
```bash
pnpm --filter @repo/db exec prisma migrate status
```
If there are any drift or pending migrations, generate them before opening the PR.

---

Thank you for helping keep our database state robust, clean, and safe!
