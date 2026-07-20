import { betterAuth } from "better-auth";
import type { User, Session } from "better-auth";
import { authOptions } from "./index";
import { admin, customSession, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { nextCookies } from "better-auth/next-js";
import { UserRole, MemberRole } from "@repo/db";
import { db } from "@repo/db";
import { getRedisClient } from "@repo/shared/redis";
import { env } from "@repo/env";

// Extended User interface matching custom schema attributes
interface ExtendedUser extends User {
  role?: UserRole | string;
  username?: string;
}

// Extended Session interface including activeOrganizationId
interface ExtendedSession extends Session {
  activeOrganizationId?: string | null;
}

// Session cache interface
interface CachedUserData {
  activeOrganizationId?: string | null;
  memberId?: string;
  role?: MemberRole | UserRole | string;
}

// OAuth claim interfaces
interface OrganizationClaim {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface MembershipClaim {
  organizationId: string;
  memberId: string | undefined;
  role: MemberRole | undefined;
}

export const auth = betterAuth({
  ...authOptions,
  databaseHooks: {
    user: {
      create: {
        after: async (user: ExtendedUser) => {
          try {
            const { sendSystemNotification } =
              await import("@repo/notifications");
            await sendSystemNotification(
              `🎉 *New User Joined*\n• *Name*: ${user.name || "N/A"}\n• *Email*: ${user.email}\n• *Role*: ${user.role || "MEMBER"}\n• *ID*: \`${user.id}\``,
            );
          } catch (error: unknown) {
            console.error(
              "Failed to send new user signup notification:",
              error,
            );
          }
        },
      },
    },
  },
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "scryme.tech",
      "app.scryme.tech",
      "crm.scryme.tech",
      "api.scryme.tech",
      "*.scryme.tech",
    ],
    protocol: env.NODE_ENV === "development" ? "http" : "https",
    fallback:
      env.BETTER_AUTH_URL ||
      (env.NODE_ENV === "production"
        ? "https://app.scryme.tech"
        : "http://localhost:3000"),
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: env.NODE_ENV === "production" ? "scryme.tech" : undefined,
    },
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
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 1000, // Relaxed default max requests per window
    storage: "secondary-storage", // Store in Redis secondary-storage
    customRules: {
      "/get-session": false, // Disable rate limiting completely for get-session to prevent false positive logouts
    },
  },
  secondaryStorage: {
    get: async (key: string): Promise<string | null> => {
      try {
        const redis = await getRedisClient();
        const value = await redis.get(key);
        if (value === null || value === undefined) return null;
        if (typeof value === "string") return value;
        return JSON.stringify(value);
      } catch (e: unknown) {
        console.error("Redis get error:", e);
        return null;
      }
    },
    set: async (key: string, value: string, ttl?: number): Promise<void> => {
      try {
        const redis = await getRedisClient();
        if (ttl) {
          await redis.setex(key, ttl, value);
        } else {
          await redis.setex(key, 3600, value); // Default 1 hour TTL if not specified
        }
      } catch (e: unknown) {
        console.error("Redis set error:", e);
      }
    },
    delete: async (key: string): Promise<void> => {
      try {
        const redis = await getRedisClient();
        await redis.del(key);
      } catch (e: unknown) {
        console.error("Redis delete error:", e);
      }
    },
  },
  plugins: [
    jwt(),
    admin({
      defaultRole: UserRole.MEMBER,
    }),
    customSession(
      async ({ user, session }: { user: ExtendedUser; session: Session }) => {
        const cacheKey = `session-cache:${user.id}`;
        try {
          const redis = await getRedisClient();
          const cached = await redis.get(cacheKey);
          if (cached) {
            const parsedCache: CachedUserData =
              typeof cached === "string"
                ? (JSON.parse(cached) as CachedUserData)
                : (cached as CachedUserData);

            return {
              user: { ...user, ...parsedCache },
              session: {
                ...session,
                activeOrganizationId: parsedCache.activeOrganizationId ?? null,
              } as ExtendedSession,
            };
          }
        } catch (e: unknown) {
          console.error("Redis error:", e);
        }

        // Fetch from Database
        const usr = await db.user.findUnique({
          where: { id: user.id },
          select: { activeOrganizationId: true },
        });

        let activeOrganizationId: string | null =
          usr?.activeOrganizationId || null;

        // If activeOrganizationId is not set, try to fallback to their first active membership
        if (!activeOrganizationId) {
          const firstMembership = await db.member.findFirst({
            where: { userId: user.id, deletedAt: null },
            select: { organizationId: true },
          });

          if (firstMembership) {
            activeOrganizationId = firstMembership.organizationId;
            // Persist the resolved activeOrganizationId in the database
            await db.user.update({
              where: { id: user.id },
              data: { activeOrganizationId },
            });
          }
        }

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

        const customUserData: CachedUserData = {
          activeOrganizationId,
          memberId: memberData.memberId,
          role: memberData.role || user.role,
        };

        try {
          const redis = await getRedisClient();
          // Store as JSON string with 1 minute TTL
          await redis.setex(cacheKey, 60, JSON.stringify(customUserData));
        } catch (e: unknown) {
          console.error("Redis cache error:", e);
        }

        // Return combined data with activeOrganizationId included on both user and session
        return {
          user: { ...user, ...customUserData },
          session: {
            ...session,
            activeOrganizationId,
          } as ExtendedSession,
        };
      },
    ),
    oauthProvider({
      loginPage: "/login",
      consentPage: "/oauth/authorize",
      scopes: ["openid", "profile", "email", "org_info", "membership"],
      allowDynamicClientRegistration: true,
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
      customUserInfoClaims: async ({
        user,
        scopes,
      }: {
        user: ExtendedUser;
        scopes: string[];
      }) => {
        const claims: Record<string, unknown> = {};

        if (scopes.includes("profile")) {
          claims.name = user.name;
          claims.image = user.image;
          claims.username = user.username;
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
            claims.organizations = organizations.map(
              (org): OrganizationClaim => ({
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo: org.logo,
              }),
            );
          }

          if (scopes.includes("membership")) {
            claims.memberships = organizations.map((org): MembershipClaim => ({
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
