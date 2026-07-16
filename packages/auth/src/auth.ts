import { betterAuth } from "better-auth";
import { authOptions } from "./index";
import { admin, customSession, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { nextCookies } from "better-auth/next-js";
import { UserRole, MemberRole } from "@repo/db";
import { db } from "@repo/db";
import { getRedisClient } from "@repo/shared/redis";
import { env } from "@repo/env";

import { sendSystemNotification } from "@repo/notifications";

export const auth = betterAuth({
  ...(authOptions as any),
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          try {
            await sendSystemNotification(
              `🎉 *New User Joined*\n• *Name*: ${user.name || "N/A"}\n• *Email*: ${user.email}\n• *Role*: ${user.role || "MEMBER"}\n• *ID*: \`${user.id}\``
            );
          } catch (error: any) {
            console.error("Failed to send new user signup notification:", error);
          }
        },
      },
    },
  },
  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "localhost:3001",
      "localhost:3002",
      "scryme.tech",
      "app.scryme.tech",
      "crm.scryme.tech",
      "api.scryme.tech",
      "*.scryme.tech",
    ],
    protocol: env.NODE_ENV === "development" ? "http" : "https",
    fallback: env.BETTER_AUTH_URL || (env.NODE_ENV === "production" ? "https://app.scryme.tech" : "http://localhost:3000"),
  },
  session: {
    preserveSessionInDatabase: true,
    storeSessionInDatabase: true,
  },
  trustedOrigins: [
    "*.scryme.tech",
    "https://scryme.tech",
    "https://app.scryme.tech",
    "https://crm.scryme.tech",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  secondaryStorage: {
    get: async (key: string) => {
      try {
        const redis = await getRedisClient();
        const value = await redis.get(key);
        // value could be string, object, or null
        if (value === null || value === undefined) return null;
        // If it's already a string, return it directly
        if (typeof value === "string") return value;
        // If it's an object, stringify it for better-auth compatibility
        return JSON.stringify(value);
      } catch (e) {
        console.error("Redis get error:", e);
        return null;
      }
    },
    set: async (key: string, value: string, ttl?: number) => {
      try {
        const redis = await getRedisClient();
        if (ttl) {
          await redis.setex(key, ttl, value);
        } else {
          await redis.setex(key, 3600, value); // Default 1 hour TTL if not specified
        }
      } catch (e) {
        console.error("Redis set error:", e);
      }
    },
    delete: async (key: string) => {
      try {
        const redis = await getRedisClient();
        await redis.del(key);
      } catch (e) {
        console.error("Redis delete error:", e);
      }
    },
  },
  plugins: [
    jwt(),
    admin({
      defaultRole: UserRole.MEMBER,
    }),
    customSession(async ({ user, session }) => {
      const cacheKey = `session-cache:${user.id}`;
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          // cached could be a string or parsed object
          const parsedCache =
            typeof cached === "string" ? JSON.parse(cached) : cached;
          return {
            user: { ...user, ...parsedCache },
            session,
          };
        }
      } catch (e) {
        console.error("Redis error:", e);
      }

      // Fetch from Database
      const usr = await db.user.findUnique({
        where: { id: user.id },
        select: { activeOrganizationId: true },
      });

      const activeOrganizationId = usr?.activeOrganizationId || null;

      // Default member values
      let memberData: {
        memberId: string | undefined;
        role: MemberRole | undefined;
      } = { memberId: undefined, role: undefined };

      // Fetch membership details if active org exists
      if (activeOrganizationId) {
        const member = await db.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: activeOrganizationId,
              userId: user.id,
            },
          },
          select: { id: true, role: true },
        });

        if (member) {
          memberData = { memberId: member.id, role: member.role };
        }
      }

      const customUserData = {
        activeOrganizationId,
        memberId: memberData.memberId,
        role: memberData.role,
      };

      try {
        const redis = await getRedisClient();
        // Store as JSON with 1 minute TTL
        await redis.setex(cacheKey, 60, customUserData);
      } catch (e) {
        console.error("Redis cache error:", e);
      }

      // Return the combined data
      return {
        user: { ...user, ...customUserData },
        session,
      };
    }),
    oauthProvider({
      loginPage: "/login",
      consentPage: "/oauth/authorize",
      scopes: ["openid", "profile", "email", "org_info", "membership"],
      allowDynamicClientRegistration: true,
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
      customUserInfoClaims: async ({ user, scopes }) => {
        const claims: any = {};
        if (scopes.includes("profile")) {
          claims.name = user.name;
          claims.image = user.image;
          claims.username = (user as any).username;
        }
        if (scopes.includes("email")) {
          claims.email = user.email;
          claims.email_verified = user.emailVerified;
        }
        if (scopes.includes("org_info") || scopes.includes("membership")) {
          const organizations = await db.organization.findMany({
            where: {
              members: {
                some: { userId: user.id },
              },
            },
            include: {
              members: {
                where: { userId: user.id },
                select: { role: true, id: true },
              },
            },
          });

          if (scopes.includes("org_info")) {
            claims.organizations = organizations.map((org) => ({
              id: org.id,
              name: org.name,
              slug: org.slug,
              logo: org.logo,
            }));
          }

          if (scopes.includes("membership")) {
            claims.memberships = organizations.map((org) => ({
              organizationId: org.id,
              memberId: org.members[0]?.id,
              role: org.members[0]?.role,
            }));
          }
        }
        return claims;
      },
    }),
    nextCookies(),
  ],
});
