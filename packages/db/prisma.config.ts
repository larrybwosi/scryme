import { config } from "dotenv";
import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

// Load .env from root if it exists
config({
  path: path.resolve(__dirname, "../../.env"),
  debug: false,
  quiet: true,
});

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
