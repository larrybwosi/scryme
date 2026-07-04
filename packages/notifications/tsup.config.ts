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
    "@repo/db",
    "@repo/scryme",
    "axios",
    "handlebars",
    "nodemailer",
  ],
};

export default defineConfig([
  {
    ...commonOptions,
    clean: true,
    entry: {
      index: "src/index.ts",
      server: "src/server.ts",
    },
  },
]);
