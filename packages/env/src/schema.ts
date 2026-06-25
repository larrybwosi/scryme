import { z } from "zod";

export const serverSchema = z.object({
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

export const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3002"),
  NEXT_PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CRM_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_COOKIE_DOMAIN: z.string().optional(),

  // Realtime Configuration
  NEXT_PUBLIC_REALTIME_PROVIDER: z.enum(["ably", "socketio"]).default("ably"),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().default("http://localhost:3002"),
});
