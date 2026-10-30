"use server";

import { db } from "@repo/db";
import { requireSuperAdmin } from "./auth";

export type ActivityType =
  | "LOGIN"
  | "POS_SALE"
  | "ONLINE_ORDER"
  | "SALES_ORDER"
  | "OTHER_TRANSACTION";

export interface ActivityLogItem {
  id: string;
  type: ActivityType;
  timestamp: Date;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  channel?: string | null;
  title: string;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

export interface ActivityFiltersInput {
  userId?: string;
  organizationId?: string;
  activityType?: ActivityType | "ALL";
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getActivityFilterOptions() {
  await requireSuperAdmin();

  const [users, organizations] = await Promise.all([
    db.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    }),
    db.organization.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return { users, organizations };
}

export async function getUserActivityLogs(filters: ActivityFiltersInput = {}) {
  await requireSuperAdmin();

  const {
    userId,
    organizationId,
    activityType = "ALL",
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  // Pre-fetch organizations mapping for fast lookup
  const orgs = await db.organization.findMany({
    select: { id: true, name: true },
  });
  const orgMap = new Map<string, string>(orgs.map((o) => [o.id, o.name]));

  const fetchSessions = activityType === "ALL" || activityType === "LOGIN";
  const fetchTransactions = activityType === "ALL" || activityType !== "LOGIN";

  const sessionWhere: any = {};
  if (userId) {
    sessionWhere.userId = userId;
  }
  if (organizationId) {
    sessionWhere.activeOrganizationId = organizationId;
  }
  if (start || end) {
    sessionWhere.createdAt = {};
    if (start) sessionWhere.createdAt.gte = start;
    if (end) sessionWhere.createdAt.lte = end;
  }
  if (search) {
    sessionWhere.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { userAgent: { contains: search, mode: "insensitive" } },
    ];
  }

  const transactionWhere: any = {};
  if (organizationId) {
    transactionWhere.organizationId = organizationId;
  }
  if (userId) {
    transactionWhere.member = { userId };
  }
  if (start || end) {
    transactionWhere.createdAt = {};
    if (start) transactionWhere.createdAt.gte = start;
    if (end) transactionWhere.createdAt.lte = end;
  }
  if (activityType !== "ALL" && activityType !== "LOGIN") {
    if (activityType === "POS_SALE") {
      transactionWhere.type = "POS_SALE";
    } else if (activityType === "ONLINE_ORDER") {
      transactionWhere.type = "ONLINE_ORDER";
    } else if (activityType === "SALES_ORDER") {
      transactionWhere.type = "SALES_ORDER";
    }
  }
  if (search) {
    transactionWhere.OR = [
      { number: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { member: { user: { name: { contains: search, mode: "insensitive" } } } },
      {
        member: { user: { email: { contains: search, mode: "insensitive" } } },
      },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [
    rawSessions,
    rawTransactions,
    totalSessionsCount,
    totalTransactionsCount,
  ] = await Promise.all([
    fetchSessions
      ? db.session.findMany({
          where: sessionWhere,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        })
      : Promise.resolve([]),
    fetchTransactions
      ? db.transaction.findMany({
          where: transactionWhere,
          include: {
            member: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            organization: {
              select: { id: true, name: true },
            },
            customer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        })
      : Promise.resolve([]),
    fetchSessions
      ? db.session.count({ where: sessionWhere })
      : Promise.resolve(0),
    fetchTransactions
      ? db.transaction.count({ where: transactionWhere })
      : Promise.resolve(0),
  ]);

  const mappedSessions: ActivityLogItem[] = rawSessions.map((s) => ({
    id: `session-${s.id}`,
    type: "LOGIN",
    timestamp: s.createdAt,
    userId: s.userId,
    userName: s.user?.name || "Unknown User",
    userEmail: s.user?.email || null,
    organizationId: s.activeOrganizationId,
    organizationName: s.activeOrganizationId
      ? orgMap.get(s.activeOrganizationId) || "Organization"
      : "Global Admin",
    channel: "WEB_APP",
    title: "User Login Session",
    description: `User authenticated from IP ${s.ipAddress || "Unknown"}`,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    metadata: {
      expiresAt: s.expiresAt,
      impersonatedBy: s.impersonatedBy,
    },
  }));

  const mappedTransactions: ActivityLogItem[] = rawTransactions.map((t) => {
    let type: ActivityType = "OTHER_TRANSACTION";
    if (t.type === "POS_SALE") type = "POS_SALE";
    else if (t.type === "ONLINE_ORDER") type = "ONLINE_ORDER";
    else if (t.type === "SALES_ORDER") type = "SALES_ORDER";

    const userName = t.member?.user?.name || "System/Guest Staff";
    const userEmail = t.member?.user?.email || null;
    const userId = t.member?.user?.id || null;

    const amountStr = `${t.currencyCode || "USD"} ${Number(t.finalTotal).toFixed(2)}`;

    return {
      id: `txn-${t.id}`,
      type,
      timestamp: t.createdAt,
      userId,
      userName,
      userEmail,
      organizationId: t.organizationId,
      organizationName: t.organization.name,
      channel: t.channel,
      title: `${t.type.replace(/_/g, " ")} (${t.number})`,
      description: `Total: ${amountStr} • Status: ${t.status}${t.customer ? ` • Customer: ${t.customer.name}` : ""}`,
      metadata: {
        number: t.number,
        total: Number(t.finalTotal),
        currency: t.currencyCode,
        status: t.status,
        paymentStatus: t.paymentStatus,
        customerName: t.customer?.name,
      },
    };
  });

  // Combine and sort by timestamp descending
  const allLogs = [...mappedSessions, ...mappedTransactions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const totalItems = totalSessionsCount + totalTransactionsCount;
  const totalPages = Math.ceil(allLogs.length / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = allLogs.slice(startIndex, startIndex + limit);

  // Compute stats
  const posSalesCount = mappedTransactions.filter(
    (t) => t.type === "POS_SALE",
  ).length;
  const loginCount = mappedSessions.length;
  const activeOrgs = new Set([
    ...mappedSessions.map((s) => s.organizationId).filter(Boolean),
    ...mappedTransactions.map((t) => t.organizationId).filter(Boolean),
  ]).size;

  return {
    items: paginatedLogs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    stats: {
      totalActivities: allLogs.length,
      posSalesCount,
      loginCount,
      activeOrgs,
    },
  };
}
