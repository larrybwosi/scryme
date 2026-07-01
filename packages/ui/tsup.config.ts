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
    "react",
    "react-dom",
    "framer-motion",
    "lucide-react",
    "clsx",
    "tailwind-merge",
    "@repo/shared",
    "@repo/db",
    "@repo/env",
    "next-themes",
    "sonner",
    "vaul",
    "embla-carousel-react",
    "recharts",
    "date-fns",
    "react-day-picker",
    "react-hook-form",
    "@hookform/resolvers",
    "zod",
    "cmdk",
    "input-otp",
    "react-resizable-panels",
    "usehooks-ts",
    "react-dropzone",
    "class-variance-authority",
    "radix-ui",
    "@base-ui/react",
    "@tanstack/react-query",
    "axios"
  ],
};

export default defineConfig([
  {
    ...commonOptions,
    clean: true,
    entry: {
      index: "src/index.tsx",
    },
  },
  {
    ...commonOptions,
    entry: [
        "src/components/**/*.tsx",
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts"
    ],
    bundle: false,
  }
]);
