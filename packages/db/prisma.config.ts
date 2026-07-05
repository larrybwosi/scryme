import { env } from "@repo/env";
import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});
