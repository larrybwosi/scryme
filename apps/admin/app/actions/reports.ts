"use server";

import { db } from "@repo/db";
import { requireSuperAdmin } from "./auth";

export async function getSystemReportsAndAnalytics() {
  await requireSuperAdmin();

  const [
    totalUsers,
    activeUsers,
    totalOrganizations,
    suspendedOrganizations,
    totalMembers,
    totalAttachments,
    storageUsageAggregate,
    totalTransactions,
    transactionVolumeAggregate,
    organizationStorageBreakdown,
    organizationActivityBreakdown,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true, banned: { not: true } } }),
    db.organization.count({ where: { deletedAt: null } }),
    db.organization.count({ where: { deletedAt: null, isSuspended: true } }),
    db.member.count({ where: { isActive: true, deletedAt: null } }),
    db.attachment.count(),
    db.attachment.aggregate({
      _sum: { sizeBytes: true },
    }),
    db.transaction.count(),
    db.transaction.aggregate({
      _sum: { finalTotal: true },
    }),
    db.organization.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        isSuspended: true,
        quotaOverrides: true,
        _count: {
          select: {
            attachments: true,
            members: true,
            transactions: true,
            products: true,
          },
        },
        attachments: {
          select: {
            sizeBytes: true,
          },
        },
      },
      take: 20,
    }),
    db.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        isSuspended: true,
        _count: {
          select: {
            members: true,
            transactions: true,
            products: true,
          },
        },
      },
    }),
  ]);

  const totalStorageBytes = storageUsageAggregate._sum.sizeBytes || 0;
  const totalVolume = Number(transactionVolumeAggregate._sum.finalTotal || 0);

  const formattedOrgStorage = organizationStorageBreakdown.map((org) => {
    const usedBytes = org.attachments.reduce(
      (acc, att) => acc + (att.sizeBytes || 0),
      0,
    );
    const overrides = (org.quotaOverrides as Record<string, any>) || {};
    const limitMB = overrides.storageLimitMB ?? (overrides.storageLimitBytes ? overrides.storageLimitBytes / (1024 * 1024) : null);
    const isStorageDisabled = Boolean(overrides.storageDisabled);

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      isSuspended: org.isSuspended,
      fileCount: org._count.attachments,
      membersCount: org._count.members,
      transactionsCount: org._count.transactions,
      productsCount: org._count.products,
      usedBytes,
      usedMB: Math.round((usedBytes / (1024 * 1024)) * 100) / 100,
      limitMB,
      isStorageDisabled,
    };
  }).sort((a, b) => b.usedBytes - a.usedBytes);

  return {
    overview: {
      totalUsers,
      activeUsers,
      totalOrganizations,
      suspendedOrganizations,
      totalMembers,
      totalAttachments,
      totalStorageBytes,
      totalStorageMB: Math.round((totalStorageBytes / (1024 * 1024)) * 100) / 100,
      totalStorageGB: Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100,
      totalTransactions,
      totalVolume,
    },
    topStorageOrganizations: formattedOrgStorage,
    recentOrganizations: organizationActivityBreakdown,
  };
}
