import { betterAuth } from "better-auth";
import { authOptions } from "./index";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins";
import { UserRole, MemberRole } from "@repo/db";
import { db } from "@repo/db";
import { getRedisClient } from "@repo/shared/redis";

export const auth = betterAuth({
  ...(authOptions as any),
  session: {
    preserveSessionInDatabase: true,
  },
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
    nextCookies(),
  ],
});
