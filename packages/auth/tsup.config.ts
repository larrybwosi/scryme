import { defineConfig, type Options } from "tsup";

const commonOptions: Options = {
  format: ["esm"],
  dts: false,
  clean: false,
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: [
    "@repo/db",
    "@repo/env",
    "@repo/shared",
    "better-auth",
    "next",
    "zod"
  ],
};

export default defineConfig([
  {
    ...commonOptions,
    clean: true,
    entry: {
      index: "src/index.ts",
      server: "src/server.ts",
      nest: "src/nest.ts",
    },
  },
]);
