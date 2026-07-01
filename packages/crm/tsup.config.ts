import { defineConfig, type Options } from "tsup";

const commonOptions: Options = {
  format: ["esm"],
  dts: false,
  clean: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: [
    "@repo/db",
    "@repo/notifications",
    "@repo/shared",
    "@repo/windmill",
    "date-fns",
    "decimal.js",
    "lucide-react",
    "react-hook-form",
    "server-only",
    "sonner",
    "use-debounce",
    "zod",
    "react",
    "react-dom"
  ],
};

export default defineConfig({
  ...commonOptions,
  entry: {
    index: "src/index.ts",
    client: "src/client.ts",
    server: "src/server.ts",
  },
});
