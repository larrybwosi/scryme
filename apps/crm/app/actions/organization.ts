"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * Retrieves the active organization for the authenticated CRM user, cached via unstable_cache.
 */
export async function getActiveOrganization(): Promise<any> {
  const auth = await getServerAuth({ allowNoOrg: true });
  if (!auth || !auth.user) return null;

  const userId = auth.user.id;
  const orgId = auth.organizationId;

  if (!orgId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { activeOrganizationId: true },
    });

    if (!user?.activeOrganizationId) {
      const firstMember = await db.member.findFirst({
        where: { userId },
        select: { organizationId: true },
      });

      if (!firstMember) return null;

      const getCachedOrg = unstable_cache(
        async (targetOrgId: string) => {
          return db.organization.findUnique({
            where: { id: targetOrgId },
            include: { settings: true },
          });
        },
        [`active-org-${firstMember.organizationId}`],
        {
          tags: [`active-org:${userId}`, `org:${firstMember.organizationId}`],
          revalidate: 3600,
        }
      );

      return getCachedOrg(firstMember.organizationId);
    }

    const getCachedOrg = unstable_cache(
      async (targetOrgId: string) => {
        return db.organization.findUnique({
          where: { id: targetOrgId },
          include: { settings: true },
        });
      },
      [`active-org-${user.activeOrganizationId}`],
      {
        tags: [`active-org:${userId}`, `org:${user.activeOrganizationId}`],
        revalidate: 3600,
      }
    );

    return getCachedOrg(user.activeOrganizationId);
  }

  const getCachedOrg = unstable_cache(
    async (targetOrgId: string) => {
      return db.organization.findUnique({
        where: { id: targetOrgId },
        include: { settings: true },
      });
    },
    [`active-org-${orgId}`],
    {
      tags: [`active-org:${userId}`, `org:${orgId}`],
      revalidate: 3600,
    }
  );

  return getCachedOrg(orgId);
}
