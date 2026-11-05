import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client.tsx", "src/server.ts", "src/react.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  clean: true,
  external: ["react", "react-dom"],
});
