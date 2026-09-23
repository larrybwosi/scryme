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
        acquisitionSource: true,
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

export async function getDashboardAnalytics() {
  await requireSuperAdmin();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    users,
    organizations,
    subscriptions,
    transactions,
    auditLogs,
  ] = await Promise.all([
    db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, acquisitionSource: true },
    }),
    db.organization.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select: { createdAt: true, acquisitionSource: true },
    }),
    db.subscription.findMany({
      select: { dodoPriceId: true },
    }),
    db.transaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, finalTotal: true, status: true },
    }),
    db.auditLog.findMany({
      take: 10,
      orderBy: { performedAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        performedAt: true,
        status: true,
        actorName: true,
        actorEmail: true,
        organizationId: true,
      },
    }),
  ]);

  // Aggregate user & organization acquisition sources
  const allUsersWithSource = await db.user.findMany({
    select: { acquisitionSource: true },
  });

  const acquisitionSourceCounts: Record<string, number> = {};
  for (const u of allUsersWithSource) {
    const src = u.acquisitionSource?.trim() ? u.acquisitionSource.trim() : "Direct / Organic";
    acquisitionSourceCounts[src] = (acquisitionSourceCounts[src] || 0) + 1;
  }

  const acquisitionSources = Object.entries(acquisitionSourceCounts)
    .map(([source, count]) => ({
      source,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Aggregate subscription tiers
  const tierCounts: Record<string, number> = {};
  for (const sub of subscriptions) {
    const tier = sub.dodoPriceId || "Free";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }
  const subscriptionTiers = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count,
  }));

  // Build daily time-series data for the last 30 days
  const timeSeriesMap: Record<
    string,
    { date: string; users: number; organizations: number; transactions: number; volume: number }
  > = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    timeSeriesMap[dateStr] = { date: dateStr, users: 0, organizations: 0, transactions: 0, volume: 0 };
  }

  for (const u of users) {
    const dateStr = u.createdAt.toISOString().split("T")[0];
    if (timeSeriesMap[dateStr]) {
      timeSeriesMap[dateStr].users += 1;
    }
  }

  for (const o of organizations) {
    const dateStr = o.createdAt.toISOString().split("T")[0];
    if (timeSeriesMap[dateStr]) {
      timeSeriesMap[dateStr].organizations += 1;
    }
  }

  for (const t of transactions) {
    const dateStr = t.createdAt.toISOString().split("T")[0];
    if (timeSeriesMap[dateStr]) {
      timeSeriesMap[dateStr].transactions += 1;
      timeSeriesMap[dateStr].volume += Number(t.finalTotal || 0);
    }
  }

  const growthTrend = Object.values(timeSeriesMap);

  return {
    acquisitionSources,
    subscriptionTiers,
    growthTrend,
    recentAuditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: String(log.action),
      entityType: String(log.entityType),
      entityId: log.entityId,
      description: log.description,
      createdAt: log.performedAt,
      status: String(log.status),
      actorName: log.actorName || null,
      actorEmail: log.actorEmail || null,
      organizationId: log.organizationId || null,
    })),
  };
}

export async function getOrganizationActivityLogs(organizationId?: string, limit = 20) {
  await requireSuperAdmin();

  const logs = await db.auditLog.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { performedAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      description: true,
      performedAt: true,
      status: true,
      severity: true,
      actorName: true,
      actorEmail: true,
      organizationId: true,
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: String(log.action),
    entityType: String(log.entityType),
    entityId: log.entityId,
    description: log.description,
    createdAt: log.performedAt,
    status: String(log.status),
    severity: String(log.severity),
    actorName: log.actorName || null,
    actorEmail: log.actorEmail || null,
    organizationId: log.organizationId || null,
  }));
}

export async function getOrganizationUsage(organizationId: string) {
  await requireSuperAdmin();

  const [
    memberCount,
    locationCount,
    transactionCount,
    deviceCount,
    batchCount,
    transactionAggregate,
  ] = await Promise.all([
    db.member.count({ where: { organizationId, deletedAt: null } }),
    db.inventoryLocation.count({ where: { organizationId, isActive: true } }),
    db.transaction.count({ where: { organizationId } }),
    db.deviceRegistry.count({ where: { organizationId, status: "ACTIVE" } }),
    db.stockBatch.count({ where: { organizationId } }),
    db.transaction.aggregate({
      where: { organizationId, status: "COMPLETED" },
      _sum: { finalTotal: true },
    }),
  ]);

  return {
    organizationId,
    memberCount,
    locationCount,
    transactionCount,
    deviceCount,
    batchCount,
    totalSalesVolume: Number(transactionAggregate._sum.finalTotal || 0),
  };
}
