// @ts-nocheck
import { defineConfig, type Options } from "tsup";

export function createTsupConfig(options: Options = {}) {
  return defineConfig({
    entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.d.ts", "!src/**/*.test.ts", "!src/**/*.test.tsx", "!src/**/*.spec.ts", "!src/**/*.spec.tsx"],
    format: ["esm", "cjs"],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: false,
    bundle: false,
    external: ["react", "react-dom"],
    ...options,
  });
}
