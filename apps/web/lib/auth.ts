import { betterAuth } from "better-auth";
import { authOptions } from "@repo/auth/server";
import { admin } from "better-auth/plugins";
import { username } from "better-auth/plugins/username";
import { bearer } from "better-auth/plugins/bearer";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins/custom-session";
import { UserRole, MemberRole } from "@repo/db";
import { db } from "@repo/db";
import { getUpstashRedis } from "@repo/shared";

export const auth = betterAuth({
  ...(authOptions as any),
  secondaryStorage: {
    get: async (key) => {
      try {
        const redis = getUpstashRedis();
        const value = await redis.get(key);
        return value ? JSON.stringify(value) : null;
      } catch (e) {
        return null;
      }
    },
    set: async (key, value, ttl) => {
      try {
        const redis = getUpstashRedis();
        await redis.set(key, JSON.parse(value), { ex: ttl });
      } catch (e) {}
    },
    delete: async (key) => {
      try {
        const redis = getUpstashRedis();
        await redis.del(key);
      } catch (e) {}
    },
  },
  plugins: [
    admin(),
    customSession(async ({ user, session }) => {
      const cacheKey = `session-cache:${user.id}`;
      try {
        const redis = getUpstashRedis();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return {
            user: { ...user, ...(cached as any) },
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
        const redis = getUpstashRedis();
        await redis.set(cacheKey, customUserData, { ex: 60 }); // Cache for 1 minute
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
