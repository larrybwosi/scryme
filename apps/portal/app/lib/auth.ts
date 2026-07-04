import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@repo/db";
import { env } from "@repo/env";
import { nextCookies } from "better-auth/next-js";
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  session: { preserveSessionInDatabase: true },
  user: { additionalFields: { customerId: { type: "string" }, organizationId: { type: "string" } } },
  plugins: [nextCookies()]
});