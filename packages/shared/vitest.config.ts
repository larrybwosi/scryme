import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: [
      { find: '@repo/db/client', replacement: path.resolve(__dirname, '../db/src/browser.ts') },
      { find: '@repo/db', replacement: path.resolve(__dirname, '../db/src/client.ts') },
    ],
  },
});
