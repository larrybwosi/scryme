import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/customer-auth/prisma/schema.prisma",
  migrations: {
    path: "src/customer-auth/prisma/migrations",
  },
  datasource: {
    url:
      process.env.CUSTOMER_DB ||
      process.env.CUSTOMER_DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/customer_db",
    shadowDatabaseUrl:
      process.env.CUSTOMER_SHADOW_DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/customer_shadow_db",
  },
});
