import { defineConfig, type Options } from "tsup";

const commonOptions: Options = {
  format: ["esm", "cjs"],
  dts: false,
  clean: false,
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "@react-pdf/renderer",
    "@repo/db",
    "date-fns",
    "qrcode",
  ],
};

export default defineConfig([
  {
    ...commonOptions,
    clean: true,
    entry: {
      index: "src/index.ts",
      client: "src/client.ts",
      server: "src/server.ts",
    },
  },
  {
    ...commonOptions,
    entry: [
      "src/templates/v1/**/*.tsx",
      "src/templates/v2/**/*.tsx",
      "src/templates/v3/**/*.tsx",
      "src/templates/v3/**/*.ts",
    ],
    bundle: false,
    outDir: "dist/templates",
  },
]);
