import { Pool, Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";
import { env } from "@repo/env";
import { getTenantContext } from "./tenant-context";
import { isTenantModel } from "./tenant-models";

export * from "./tenant-context";
export * from "./tenant-models";

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
  return (originalQuery as any).apply(this, [config, values, callback, ...args]);
};

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const connectionString = env.DATABASE_URL;

// 1. Create or retrieve the Pool specifically for the adapter with high resilience
if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new Pool({
    connectionString,
    max: parseInt(env.DATABASE_POOL_SIZE || "15", 10), // Scalable pool size (optimized to 15 for 4GB VPS servers)
    connectionTimeoutMillis: 10000, // Wait up to 10 seconds to connect (increased from 5000 to prevent timeouts under load)
    idleTimeoutMillis: 30000, // close idle connections after 30 seconds
    maxUses: 7500, // recycle connections to prevent memory leaks in pg
  });

  globalForPrisma.pgPool.on("error", (err) => {
    console.error("Unexpected error on idle PG connection pool client:", err);
  });
}

const pool = globalForPrisma.pgPool;

// 2. Pass the pool to the adapter with custom callbacks for error logging
if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(pool, {
    onPoolError: (err) => {
      console.error("PrismaPg Pool Error:", err);
    },
    onConnectionError: (err) => {
      console.error("PrismaPg Connection Error:", err);
    },
  });

  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

export const basePrisma = globalForPrisma.prisma!;

export function createTenantExtendedClient<T extends PrismaClient>(baseClient: T) {
  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const context = getTenantContext();

          // 1. If no tenant context active or isolation bypassed or super admin, execute normally
          if (!context || context.bypassIsolation || context.isSuperAdmin) {
            return query(args);
          }

          const activeOrgId = context.organizationId;
          if (!activeOrgId) {
            return query(args);
          }

          // 2. Check if model is a tenant model
          if (!isTenantModel(model)) {
            return query(args);
          }

          args = args || {};

          // 3. Handle filter/read operations
          const readFilterOps = [
            "findFirst",
            "findFirstOrThrow",
            "findMany",
            "count",
            "aggregate",
            "groupBy",
            "updateMany",
            "deleteMany",
          ];

          if (readFilterOps.includes(operation)) {
            args.where = args.where || {};
            if (args.where.organizationId === undefined) {
              args.where.organizationId = activeOrgId;
            } else if (
              typeof args.where.organizationId === "string" &&
              args.where.organizationId !== activeOrgId
            ) {
              // SECURITY: Override attempting to query another tenant's data
              args.where.organizationId = activeOrgId;
            }
          } else if (operation === "findUnique" || operation === "findUniqueOrThrow") {
            // Transform findUnique into findFirst with organizationId filter
            const newArgs = { ...args };
            newArgs.where = { ...(newArgs.where || {}), organizationId: activeOrgId };
            const client = baseClient as any;
            const targetModel = client[model] || client[model.toLowerCase()];
            if (targetModel && typeof targetModel.findFirst === "function") {
              const res = await targetModel.findFirst(newArgs);
              if (!res && operation === "findUniqueOrThrow") {
                throw new Error(`Record in ${model} not found for active organization`);
              }
              return res;
            }
          } else if (operation === "create" || operation === "createMany") {
            if (operation === "create") {
              args.data = args.data || {};
              if (!args.data.organizationId || args.data.organizationId !== activeOrgId) {
                args.data.organizationId = activeOrgId;
              }
            } else if (operation === "createMany") {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({
                  ...item,
                  organizationId: activeOrgId,
                }));
              } else if (args.data) {
                args.data.organizationId = activeOrgId;
              }
            }
          } else if (operation === "update" || operation === "delete") {
            // Verify that the record belongs to activeOrgId before mutating
            const client = baseClient as any;
            const targetModel = client[model] || client[model.toLowerCase()];
            if (targetModel && typeof targetModel.findFirst === "function") {
              const checkWhere = { ...(args.where || {}), organizationId: activeOrgId };
              const record = await targetModel.findFirst({ where: checkWhere });
              if (!record) {
                throw new Error(`Record in ${model} not found for active organization`);
              }
            }
          }

          return query(args);
        },
      },
    },
  });
}

export const prisma = createTenantExtendedClient(basePrisma) as unknown as PrismaClient;
export const db = prisma;

export * from "../generated/client";
import { Prisma } from "../generated/client";
export const Decimal = Prisma.Decimal;

export type SupplierGetPayload<S = any> = any;
export type SupplierDefaultArgs = any;
