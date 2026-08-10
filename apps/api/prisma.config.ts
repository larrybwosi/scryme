import { defineConfig } from "prisma/config";
import { env } from "@repo/env";

export default defineConfig({
  schema: "src/customer-auth/prisma/schema.prisma",
  datasource: {
    url: env.CUSTOMER_DB,
  },
});
