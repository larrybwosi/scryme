import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/customer-auth/prisma/schema.prisma",
  datasource: {
    url: process.env.CUSTOMER_DB,
  },
});
