import { z } from "zod";

const server = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1),
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

  // API specific
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

  // GitHub (for bakery/repo stuff)
  GITHUB_OWNER: z.string().default("larrybwosi"),
  GITHUB_REPO: z.string().default("dealio"),
  GITHUB_TOKEN: z.string().optional(),
});

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3002"),
  NEXT_PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CRM_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_COOKIE_DOMAIN: z.string().optional(),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct it manually.
 */
const processEnv = {
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
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_CRM_URL: process.env.NEXT_PUBLIC_CRM_URL,
  NEXT_PUBLIC_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
};

// Merge them for full verification
const allEnvs = { ...server.shape, ...client.shape };
const isServer = typeof window === "undefined";

const parsed = isServer
  ? z.object(allEnvs).safeParse(processEnv)
  : client.safeParse(processEnv);

if (parsed.success === false && process.env.NODE_ENV !== "test") {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = (parsed.data || {}) as z.infer<typeof server> & z.infer<typeof client>;
