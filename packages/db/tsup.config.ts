import { createTsupConfig } from "@repo/typescript-config/tsup";

export default createTsupConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx", "!src/**/*.d.ts", "!src/**/*.test.ts", "!src/**/*.test.tsx", "!src/**/*.spec.ts", "!src/**/*.spec.tsx"],
  bundle: false,
  dts: false,
  format: ["esm", "cjs"],
  clean: true,
});
