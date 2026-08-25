"use server";

import { db } from "@repo/db";
import { requireSuperAdmin } from "./auth";

export async function getSystemStats() {
  await requireSuperAdmin();

  const [
    totalUsers,
    activeUsers,
    totalOrganizations,
    suspendedOrganizations,
    totalMembers,
    totalSubscriptions,
    recentOrganizations,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true, banned: { not: true } } }),
    db.organization.count({ where: { deletedAt: null } }),
    db.organization.count({ where: { deletedAt: null, isSuspended: true } }),
    db.member.count({ where: { isActive: true, deletedAt: null } }),
    db.subscription.count(),
    db.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        createdAt: true,
        isSuspended: true,
        _count: { select: { members: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalOrganizations,
    suspendedOrganizations,
    totalMembers,
    totalSubscriptions,
    recentOrganizations,
  };
}
