import { PrismaClient, Prisma } from "../generated";
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel, import("../generated/runtime/client").DefaultArgs>;
export declare const db: PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel, import("../generated/runtime/client").DefaultArgs>;
export * from "../generated";
export declare const Decimal: typeof Prisma.Decimal;
