import { config } from "dotenv";
import "dotenv/config";
import path from "path";
import { defineConfig, env } from "prisma/config";

// Load .env from root if it exists
config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
