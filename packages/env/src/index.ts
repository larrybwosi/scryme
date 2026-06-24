import { z } from "zod";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";

// ─────────────────────────────────────────────
// This module is SERVER-ONLY.
//
// It is safe to import from:
//   - NestJS services/controllers
//   - Next.js server components, route handlers, middleware, server actions
//   - Vite SSR code / Node scripts in any app
//
// It must NEVER be imported from client-side code (browser bundles).
// Client-side env vars (NEXT_PUBLIC_*, VITE_*) are framework-specific and
// must be read directly via process.env.NEXT_PUBLIC_X or import.meta.env.VITE_X
// in the consuming app, because Next/Vite perform static text replacement
// of those exact expressions at build time — that replacement cannot happen
// if the reference is hidden behind a function call in a shared module.
// ─────────────────────────────────────────────

if (typeof window !== "undefined") {
  throw new Error(
    "[env] This module is server-only and must not be imported into client/browser code. " +
      "Read NEXT_PUBLIC_* or VITE_* variables directly in the consuming app instead.",
  );
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1).default("fallback-secret-for-dev"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  USE_IOREDIS_IN_PROD: z.coerce.boolean().default(false),

  // API
  JWT_SECRET: z.string().min(1).default("fallback-secret-for-dev"),
  INTERNAL_ADMIN_SECRET: z.string().optional(),
  APP_VERSION: z.string().default("1.0.0"),

  // Zitadel
  ZITADEL_DOMAIN: z.string().optional(),
  ZITADEL_CLIENT_ID: z.string().optional(),
  ZITADEL_API_URL: z.string().url().optional(),
  ZITADEL_ORG_ID: z.string().optional(),
  ZITADEL_PROJECT_ID: z.string().optional(),

  // Slack
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().optional(),

  // GitHub
  GITHUB_OWNER: z.string().default("larrybwosi"),
  GITHUB_REPO: z.string().default("dealio"),
  GITHUB_TOKEN: z.string().optional(),

  // OpenObserve
  OPENOBSERVE_URL: z.string().url().optional(),
  OPENOBSERVE_ORG: z.string().optional(),
  OPENOBSERVE_STREAM: z.string().optional(),
  OPENOBSERVE_TOKEN: z.string().optional(),

  // Storage Configuration
  STORAGE_PROVIDER: z.enum(["sanity", "rustfs"]).default("sanity"),

  // Sanity Configuration
  SANITY_PROJECT_ID: z.string().optional(),
  SANITY_DATASET: z.string().optional(),
  SANITY_API_TOKEN: z.string().optional(),

  // RustFS (S3 Compatible) Configuration
  RUSTFS_ENDPOINT: z.string().url().optional(),
  RUSTFS_ACCESS_KEY: z.string().optional(),
  RUSTFS_SECRET_KEY: z.string().optional(),
  RUSTFS_REGION: z.string().default("us-east-1"),
  RUSTFS_BUCKET: z.string().default("dealio-uploads"),
  RUSTFS_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  RUSTFS_PUBLIC_URL: z.string().url().optional(),

  // Realtime Configuration
  REALTIME_PROVIDER: z.enum(["ably", "socketio"]).default("ably"),
  ABLY_API_KEY: z.string().optional(),
  SOCKET_URL: z.string().url().default("http://localhost:3002"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

// ─────────────────────────────────────────────
// .env file loader
// ─────────────────────────────────────────────
function loadEnvFiles(): void {
  try {
    const currentDir = process.cwd();

    // Walk up to find the monorepo root.
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

    // Root-level files load first; app-level files load after with
    // override:true so they take priority over root-level values.
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
          debug: false,
        });
        expand({ ...config, override: true });
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
function parseEnv(): ServerEnv {
  loadEnvFiles();

  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      "❌ Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error(
      "Invalid environment variables. See the errors above for which fields are missing or malformed.",
    );
  }

  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;
