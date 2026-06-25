import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { serverSchema, clientSchema } from "./schema";

// ─────────────────────────────────────────────
// Env file loader (Node.js/ESM compatible)
// ─────────────────────────────────────────────
function loadEnvFiles() {
  try {
    const currentDir = process.cwd();

    // Walk up to find the monorepo root
    let rootDir: string | null = null;
    let checkDir = currentDir;
    while (checkDir !== path.parse(checkDir).root) {
      if (
        fs.existsSync(path.join(checkDir, "pnpm-workspace.yaml")) ||
        fs.existsSync(path.join(checkDir, "turbo.json"))
      ) {
        rootDir = checkDir;
        break;
      }
      checkDir = path.dirname(checkDir);
    }

    const envFiles = [
      ...(rootDir && rootDir !== currentDir
        ? [path.join(rootDir, ".env"), path.join(rootDir, ".env.local")]
        : []),
      path.join(currentDir, ".env"),
      path.join(currentDir, ".env.local"),
    ];

    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        const config = dotenv.config({
          path: file,
          override: true,
        });
        expand(config);
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[env] Failed to load .env files:", e);
    }
  }
}

// ─────────────────────────────────────────────
// Parse and validate
// ─────────────────────────────────────────────
function parseEnv() {
  loadEnvFiles();
  const raw = process.env;

  const parsed = serverSchema.safeParse(raw);
  if (!parsed.success && process.env.NODE_ENV !== "test") {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return {
    ...(parsed.data ?? {}),
    ...clientSchema.parse(raw),
  } as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
}

export const env = parseEnv();
export type Env = typeof env;
