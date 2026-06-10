import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/client";
import { env } from "@repo/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

// 1. Create the Pool specifically for the adapter
const connectionString = env.DATABASE_URL;

const pool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString,
  });

if (env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

// 2. Pass the pool to the adapter
const adapter = new PrismaPg(pool);

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
