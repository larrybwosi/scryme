import { defineConfig, type Options } from "tsup";

const commonOptions: Options = {
  format: ["esm"],
  dts: false,
  clean: false, // Handled by separate clean script or first entry
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // Externalize all dependencies to keep the shared package light
  external: [
    "react",
    "react-dom",
    "@repo/db",
    "@repo/env",
    "@prisma/client",
    "ably",
    "axios",
    "ioredis",
    "lucide-react",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@nestjs/common",
    "@repo/documents",
    "@repo/notifications",
    "@repo/scryme",
    "@sanity/client",
    "@tanstack/react-query",
    "@upstash/redis",
    "argon2",
    "bcryptjs",
    "clsx",
    "decimal.js",
    "jose",
    "jsonwebtoken",
    "nanoid",
    "qrcode",
    "server-only",
    "sharp",
    "socket.io-client",
    "sonner",
    "tailwind-merge",
    "zod",
    "zustand"
  ],
};

export default defineConfig([
  {
    ...commonOptions,
    clean: true, // Only first entry cleans
    entry: {
      index: "src/index.ts",
      ably: "src/ably/index.ts",
      axios: "src/axios/index.ts",
      constants: "src/constants/index.ts",
      integrations: "src/integrations/index.ts",
      redis: "src/redis/index.ts",
      utils: "src/utils/index.ts",
      realtime: "src/realtime/index.ts",
      storage: "src/storage/index.ts",
      "api/v2": "src/api/v2/index.ts",
      lib: "src/lib/index.ts",
      actions: "src/actions/index.ts",
      "services/openloyalty": "src/services/openloyalty/index.ts",
      "services/customer": "src/services/customer/index.ts",
      suppliers: "src/suppliers/index.ts",
      "suppliers/server": "src/suppliers/server.ts",
      server: "src/server/index.ts",
      "node-utils": "src/node-utils.ts",
    },
  },
  {
    ...commonOptions,
    entry: {
      "ably/client": "src/ably/client.ts",
      "realtime/client": "src/realtime/client.tsx",
    },
    onSuccess: async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const files = ['dist/ably/client.js', 'dist/realtime/client.js'];
      for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (!content.includes('"use client"')) {
            await fs.writeFile(filePath, `"use client";\n${content}`);
            console.log(`Added "use client" to ${file}`);
          }
        } catch (err) {
          console.error(`Error processing ${file}:`, err);
        }
      }
    }
  },
]);
