import { z } from "zod";

// ─────────────────────────────────────────────
// Environment detection
// ─────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";
const isNextJs =
  (!isBrowser &&
    typeof process !== "undefined" &&
    !!process.env.NEXT_RUNTIME) ||
  !!process.env.__NEXT_PRIVATE_ORIGIN;
const isNestJs = !isBrowser && !isNextJs;

// ─────────────────────────────────────────────
// Schemas
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
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3002"),
  NEXT_PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CRM_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_COOKIE_DOMAIN: z.string().optional(),
});

// ─────────────────────────────────────────────
// Env file loader (Node.js only — skipped in browser)
// Used by both Next.js (if called before framework init)
// and NestJS (called at module load time).
// @nestjs/config / Next.js will also load .env files on
// their own, but this ensures the vars are available for
// this validation step regardless of framework.
// ─────────────────────────────────────────────
function loadEnvFiles() {
  if (isBrowser) return;

  try {
    const fs = require("fs");
    const path = require("path");
    const dotenv = require("dotenv");
    const { expand } = require("dotenv-expand");

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

    // App-level files take priority over root-level files.
    // We load root first so app-level can override with override:true.
    const envFiles = [
      // Root level (lowest priority)
      ...(rootDir && rootDir !== currentDir
        ? [path.join(rootDir, ".env"), path.join(rootDir, ".env.local")]
        : []),
      // App level (highest priority)
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
// Collect raw process.env values
// ─────────────────────────────────────────────
function getRawEnv() {
  return {
    // Server
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_URL: process.env.REDIS_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    USE_IOREDIS_IN_PROD: process.env.USE_IOREDIS_IN_PROD,
    JWT_SECRET: process.env.JWT_SECRET,
    INTERNAL_ADMIN_SECRET: process.env.INTERNAL_ADMIN_SECRET,
    APP_VERSION: process.env.APP_VERSION,
    ZITADEL_DOMAIN: process.env.ZITADEL_DOMAIN,
    ZITADEL_CLIENT_ID: process.env.ZITADEL_CLIENT_ID,
    ZITADEL_API_URL: process.env.ZITADEL_API_URL,
    ZITADEL_ORG_ID: process.env.ZITADEL_ORG_ID,
    ZITADEL_PROJECT_ID: process.env.ZITADEL_PROJECT_ID,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    // OpenObserve
    OPENOBSERVE_URL: process.env.OPENOBSERVE_URL,
    OPENOBSERVE_ORG: process.env.OPENOBSERVE_ORG,
    OPENOBSERVE_STREAM: process.env.OPENOBSERVE_STREAM,
    OPENOBSERVE_TOKEN: process.env.OPENOBSERVE_TOKEN,
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_CRM_URL: process.env.NEXT_PUBLIC_CRM_URL,
    NEXT_PUBLIC_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  };
}

// ─────────────────────────────────────────────
// Parse and validate
// ─────────────────────────────────────────────
function parseEnv() {
  // NestJS and standalone Node processes need to load .env themselves.
  // Next.js already loads .env files before module evaluation, so this
  // is a no-op there (vars already set, dotenv skips them unless override).
  if (!isBrowser) {
    loadEnvFiles();
  }

  const raw = isBrowser ? process.env : getRawEnv();

  // Browser: only validate public client vars
  if (isBrowser) {
    const parsed = clientSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(
        "❌ Invalid client environment variables:",
        parsed.error.flatten().fieldErrors,
      );
      throw new Error("Invalid client environment variables");
    }
    return parsed.data as z.infer<typeof serverSchema> &
      z.infer<typeof clientSchema>;
  }

  // NestJS: only needs server vars — NEXT_PUBLIC_* won't exist and that's fine
  if (isNestJs) {
    const parsed = serverSchema.safeParse(raw);
    if (!parsed.success && process.env.NODE_ENV !== "test") {
      console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors,
      );
      throw new Error("Invalid environment variables");
    }
    // Fill client vars with empty defaults so the type is satisfied
    return {
      ...(parsed.data ?? {}),
      ...clientSchema.parse({}), // uses schema defaults
    } as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
  }

  // Next.js server: validate both server + client vars
  const fullSchema = serverSchema.merge(clientSchema);
  const parsed = fullSchema.safeParse(raw);
  if (!parsed.success && process.env.NODE_ENV !== "test") {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return (parsed.data ?? {}) as z.infer<typeof serverSchema> &
    z.infer<typeof clientSchema>;
}

export const env = parseEnv();

export type Env = typeof env;
