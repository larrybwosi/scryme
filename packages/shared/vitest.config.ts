import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@repo/db": path.resolve(__dirname, "../db/src/client.ts"),
    },
  },
});
