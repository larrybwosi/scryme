import { Pool, Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";
import { env } from "@repo/env";

// Monkey-patch pg.Client.prototype.query to avoid deprecation warnings in @prisma/adapter-pg
const originalQuery = Client.prototype.query;
(Client.prototype as any).query = function (
  this: any,
  config: any,
  values: any,
  callback: any,
  ...args: any[]
) {
  if (config && typeof config === "object" && Array.isArray(values)) {
    if (config.values === values) {
      return (originalQuery as any).call(this, config, callback);
    }
  }
  return originalQuery.apply(this, [config, values, callback, ...args]);
};

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// 1. Create the Pool specifically for the adapter with high resilience
const connectionString = env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: parseInt(env.DATABASE_POOL_SIZE || "50", 10), // Scalable pool size
  connectionTimeoutMillis: 5000, // wait up to 5 seconds to connect
  idleTimeoutMillis: 30000, // close idle connections after 30 seconds
  maxUses: 7500, // recycle connections to prevent memory leaks in pg
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PG connection pool client:", err);
});

// 2. Pass the pool to the adapter with custom callbacks for error logging
const adapter = new PrismaPg(pool, {
  onPoolError: (err) => {
    console.error("PrismaPg Pool Error:", err);
  },
  onConnectionError: (err) => {
    console.error("PrismaPg Connection Error:", err);
  },
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export const db = prisma;
export * from "../generated/client";
import { Prisma } from "../generated/client";
export const Decimal = Prisma.Decimal;

export type SupplierGetPayload<S = any> = any;
export type SupplierDefaultArgs = any;
