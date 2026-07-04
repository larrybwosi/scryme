import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";
import { env } from "@repo/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// 1. Create the Pool specifically for the adapter
const connectionString = env.DATABASE_URL;

// 2. Pass the pool to the adapter
const adapter = new PrismaPg({ connectionString });

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
