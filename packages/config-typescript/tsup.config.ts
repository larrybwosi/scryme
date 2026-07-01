import { defineConfig, type Options } from "tsup";

export function createTsupConfig(options: Options = {}) {
  return defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: false,
    sourcemap: true,
    clean: true,
    minify: false,
    external: ["react", "react-dom"],
    ...options,
  });
}
