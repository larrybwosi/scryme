import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../prisma/generated/client";
import { env } from "@repo/env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Create the Pool specifically for the adapter
const connectionString = env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

// 2. Pass the pool to the adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    // Optional: Log queries to see if connection works
    // log: ['query', 'info', 'warn', 'error'],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export const db = prisma;
export * from "../prisma/generated/client";
import { Prisma } from "../prisma/generated/client";
export const Decimal = Prisma.Decimal;
