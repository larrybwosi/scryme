import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client.tsx", "src/server.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  clean: true,
});
