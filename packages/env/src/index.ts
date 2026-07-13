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
  DATABASE_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().default("postgresql://postgres:postgres@localhost:5432/scryme"),
  ),
  DATABASE_POOL_SIZE: z.string().optional(),
  PORT: z.coerce.number().default(3001),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1).default("fallback-secret-for-dev"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
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
  ZITADEL_API_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().optional(),
  ),
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
  OPENOBSERVE_URL: z.url().optional(),
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
  RUSTFS_ENDPOINT: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().optional(),
  ),
  RUSTFS_ACCESS_KEY: z.string().optional(),
  RUSTFS_SECRET_KEY: z.string().optional(),
  RUSTFS_REGION: z.string().default("us-east-1"),
  RUSTFS_BUCKET: z.string().default("dealio-uploads"),
  RUSTFS_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  RUSTFS_PUBLIC_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().optional(),
  ),

  // Realtime Configuration
  REALTIME_PROVIDER: z.enum(["ably", "socketio"]).default("ably"),
  ABLY_API_KEY: z.string().optional(),
  SOCKET_URL: z.url().default("http://localhost:3002"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_API_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().default("http://localhost:3002"),
  ),
  NEXT_PUBLIC_WEB_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_CRM_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().default("http://localhost:3001"),
  ),
  NEXT_PUBLIC_COOKIE_DOMAIN: z.string().optional(),

  // Realtime Configuration
  NEXT_PUBLIC_REALTIME_PROVIDER: z.enum(["ably", "socketio"]).default("ably"),
  NEXT_PUBLIC_SOCKET_URL: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.url().default("http://localhost:3002"),
  ),
});

// ─────────────────────────────────────────────
// Env file loader (Node.js only — skipped in browser)
// ─────────────────────────────────────────────

// Indirect require, hidden from bundler static analysis (webpack/Turbopack)
// so this code path isn't eagerly resolved/bundled for client or edge runtimes.
const nodeRequire: NodeJS.Require | undefined =
  typeof require !== "undefined"
    ? // eslint-disable-next-line no-eval
      (eval("require") as NodeJS.Require)
    : undefined;

function loadEnvFiles() {
  if (isBrowser) return;
  // Only run in an actual Node.js process (not edge runtime), where
  // process.versions.node is present.
  if (
    typeof process === "undefined" ||
    !process.versions?.node ||
    !nodeRequire
  ) {
    return;
  }

  try {
    const fs = nodeRequire("fs");
    const path = nodeRequire("path");
    const dotenv = nodeRequire("dotenv");
    const { expand } = nodeRequire("dotenv-expand");

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
    DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
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
    // Storage Configuration
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    // Sanity Configuration
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    SANITY_DATASET: process.env.SANITY_DATASET,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
    // RustFS (S3 Compatible) Configuration
    RUSTFS_ENDPOINT: process.env.RUSTFS_ENDPOINT,
    RUSTFS_ACCESS_KEY: process.env.RUSTFS_ACCESS_KEY,
    RUSTFS_SECRET_KEY: process.env.RUSTFS_SECRET_KEY,
    RUSTFS_REGION: process.env.RUSTFS_REGION,
    RUSTFS_BUCKET: process.env.RUSTFS_BUCKET,
    RUSTFS_FORCE_PATH_STYLE: process.env.RUSTFS_FORCE_PATH_STYLE,
    RUSTFS_PUBLIC_URL: process.env.RUSTFS_PUBLIC_URL,
    // Realtime
    REALTIME_PROVIDER: process.env.REALTIME_PROVIDER,
    ABLY_API_KEY: process.env.ABLY_API_KEY,
    SOCKET_URL: process.env.SOCKET_URL,
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_CRM_URL: process.env.NEXT_PUBLIC_CRM_URL,
    NEXT_PUBLIC_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    NEXT_PUBLIC_REALTIME_PROVIDER: process.env.NEXT_PUBLIC_REALTIME_PROVIDER,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  };
}

// ─────────────────────────────────────────────
// Parse and validate
// ─────────────────────────────────────────────
function parseEnv() {
  if (!isBrowser) {
    loadEnvFiles();
  }

  const raw = isBrowser ? process.env : getRawEnv();

  if (isBrowser) {
    const parsed = clientSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(
        "❌ Invalid client environment variables:",
        z.flattenError(parsed.error).fieldErrors,
      );
      if (
        process.env.NODE_ENV === "production" &&
        !process.env.SKIP_ENV_VALIDATION
      ) {
        throw new Error("Invalid client environment variables");
      }
    }
    return (parsed.data || clientSchema.parse({})) as z.infer<
      typeof serverSchema
    > &
      z.infer<typeof clientSchema>;
  }

  if (isNestJs) {
    const parsed = serverSchema.safeParse(raw);
    if (!parsed.success && process.env.NODE_ENV !== "test") {
      console.error(
        "❌ [NestJS Env] Invalid environment variables:",
        z.flattenError(parsed.error).fieldErrors,
      );
      if (
        process.env.NODE_ENV === "production" &&
        !process.env.SKIP_ENV_VALIDATION
      ) {
        throw new Error("Invalid environment variables");
      }
    }
    return {
      ...raw,
      ...(parsed.data ?? {}),
      ...clientSchema.parse({}),
    } as any;
  }

  const fullSchema = serverSchema.merge(clientSchema);
  const parsed = fullSchema.safeParse(raw);
  if (!parsed.success && process.env.NODE_ENV !== "test") {
    console.log(
      "❌ Invalid environment variables:",
      z.flattenError(parsed.error).fieldErrors,
    );
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.SKIP_ENV_VALIDATION
    ) {
      throw new Error("Invalid environment variables");
    }
  }

  return {
    ...raw,
    ...(parsed.data ?? {}),
  } as any;
}

export const env = parseEnv();
export type Env = typeof env;
