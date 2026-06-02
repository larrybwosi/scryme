import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Prisma } from "../generated";
const globalForPrisma = global;
// 1. Create the Pool specifically for the adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
});
// 2. Pass the pool to the adapter
const adapter = new PrismaPg(pool);
export const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
export const db = prisma;
export * from "../generated";
export const Decimal = Prisma.Decimal;
