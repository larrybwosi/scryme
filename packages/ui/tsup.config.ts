import { defineConfig, type Options } from "tsup";
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const commonOptions: Options = {
  format: ["esm"],
  dts: false,
  clean: false,
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  inject: ["./tsup-shim.js"],
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
    onSuccess: async () => {
      try {
        const filesWithUseClient = execSync('grep -rle "\\"use client\\"" src', { cwd: process.cwd() }).toString().split('\n').filter(Boolean);
        for (const file of filesWithUseClient) {
          const distFile = path.join('dist', file.replace('src/', '').replace(/\.tsx?$/, '.js'));
          try {
            const content = await fs.readFile(distFile, 'utf-8');
            if (!content.includes('"use client"')) {
              await fs.writeFile(distFile, `"use client";\n${content}`);
              console.log(`Added "use client" to ${distFile}`);
            }
          } catch (err) {
            // Skip if file doesn't exist in dist
          }
        }
      } catch (err) {
        // grep might fail if no files found
      }
    }
  }
]);
