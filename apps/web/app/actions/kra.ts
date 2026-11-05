"use server";

import { getServerAuth } from "@repo/auth/server";
import { prisma as db } from "@repo/db";
import { kraService, KRAConfiguration } from "@repo/shared/kra";
import { revalidatePath } from "next/cache";

export async function getKRAConfigAction() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  const config = await kraService.getConfiguration(auth.organizationId);
  return config;
}

export async function saveKRAConfigAction(data: {
  provider: "NAVARI" | "DIRECT_ETIMS";
  environment: "SANDBOX" | "PRODUCTION";
  enforcementMode: "BLOCKING" | "ASYNC";
  kraPin: string;
  businessName?: string;
  branchCode?: string;
  deviceSerialNumber?: string;
  controlUnitId?: string;
  apiKey?: string;
  apiSecret?: string;
  highValueThreshold?: number;
  autoSyncSales?: boolean;
  autoSyncPurchases?: boolean;
  isActive?: boolean;
}) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  if (!data.kraPin || data.kraPin.trim().length === 0) {
    throw new Error("KRA PIN is required");
  }

  const result = await kraService.saveConfiguration(auth.organizationId, {
    ...data,
    kraPin: data.kraPin.trim().toUpperCase(),
  });

  revalidatePath("/finance/reports/tax-compliance");
  revalidatePath("/settings");
  return result;
}

export async function validateKRAPinAction(kraPin: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  return await kraService.validatePin(auth.organizationId, kraPin);
}

export async function getKRALogsAction(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
  const skip = (page - 1) * limit;

  const where: any = { organizationId: auth.organizationId };
  if (params.status) {
    where.status = params.status;
  }

  const [logs, total] = await Promise.all([
    db.kRAComplianceLog.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take: limit,
    }),
    db.kRAComplianceLog.count({ where }),
  ]);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function retryKRAAction(logId: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  const log = await db.kRAComplianceLog.findFirst({
    where: { id: logId, organizationId: auth.organizationId },
  });

  if (!log) {
    throw new Error("Log not found or unauthorized");
  }

  const result = await kraService.retrySubmission(auth.organizationId, logId);
  revalidatePath("/finance/reports/tax-compliance");
  return result;
}

export async function getKRAVatSummaryAction(startDate?: string, endDate?: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const [salesLogs, purchaseLogs] = await Promise.all([
    db.kRAComplianceLog.findMany({
      where: {
        organizationId: auth.organizationId,
        submittedAt: { gte: start, lte: end },
        status: { in: ["SUBMITTED", "ACKNOWLEDGED"] },
        purchaseId: null,
      },
    }),
    db.kRAComplianceLog.findMany({
      where: {
        organizationId: auth.organizationId,
        submittedAt: { gte: start, lte: end },
        status: { in: ["SUBMITTED", "ACKNOWLEDGED"] },
        purchaseId: { not: null },
      },
    }),
  ]);

  const totalSales = salesLogs.reduce((acc, l) => acc + Number(l.taxableAmount || 0), 0);
  const outputVat = salesLogs.reduce((acc, l) => acc + Number(l.taxAmount || 0), 0);

  const totalPurchases = purchaseLogs.reduce((acc, l) => acc + Number(l.taxableAmount || 0), 0);
  const inputVat = purchaseLogs.reduce((acc, l) => acc + Number(l.taxAmount || 0), 0);

  const netVatPayable = outputVat - inputVat;

  return {
    periodStartDate: start.toISOString(),
    periodEndDate: end.toISOString(),
    totalSales,
    outputVat,
    totalPurchases,
    inputVat,
    netVatPayable,
    documentsCount: salesLogs.length + purchaseLogs.length,
  };
}
