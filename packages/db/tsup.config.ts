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
    "@prisma/client",
    "@repo/env",
    "dotenv",
    "pg",
    "@prisma/adapter-pg",
    "@prisma/client-runtime-utils",
    "../generated/client",
    "../generated/browser"
  ],
};

export default defineConfig({
  ...commonOptions,
  entry: {
    client: "src/client.ts",
    browser: "src/browser.ts",
  },
});
