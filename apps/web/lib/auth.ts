import { betterAuth } from "better-auth";
import { authOptions } from "@repo/auth/server";
import { admin } from "better-auth/plugins";
import { username } from "better-auth/plugins/username";
import { bearer } from "better-auth/plugins/bearer";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins/custom-session";
import { UserRole, MemberRole } from "@repo/db";
import { db } from "@repo/db";

export const auth = betterAuth({
  ...(authOptions as any),
  plugins: [
    admin(),
    customSession(async ({ user, session }) => {
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

      // Return the combined data
      return {
        user: { ...user, ...customUserData },
        session,
      };
    }),
    nextCookies(),
  ],
});
