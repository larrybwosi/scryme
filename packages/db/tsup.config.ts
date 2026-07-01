import { createTsupConfig } from "../config-typescript/tsup.config";

export default createTsupConfig({
  entry: ["src/client.ts", "src/browser.ts"],
  bundle: false,
  dts: false,
  format: ["esm", "cjs"],
  clean: true,
});
