"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export interface ProductionSettingsData {
  batchPrefix?: string;
  batchSeparator?: string;
  batchDateFormat?: string;
  batchSequence?: string;
  batchGenerationType?: string;
  enableProductionStaging?: boolean;
  autoApproveBatches?: boolean;
  lowStockAlerts?: boolean;
  timezone?: string;
  defaultOperatorId?: string | null;
  defaultBakerId?: string | null;
  scrymeReportEnabled?: boolean;
  scrymeReportDay?: number;
  scrymeReportTime?: string;
}

export async function getProductionSettingsAction(): Promise<{
  success: boolean;
  settings?: any;
  error?: string;
}> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let settings: any = null;
    if ((db as any).productionSettings) {
      settings = await (db as any).productionSettings.findUnique({
        where: { organizationId: session.organizationId },
        include: {
          defaultOperator: {
            include: { member: { include: { user: true } } },
          },
          operators: {
            include: { member: { include: { user: true } } },
          },
        },
      });

      if (!settings) {
        settings = await (db as any).productionSettings.create({
          data: { organizationId: session.organizationId },
          include: {
            defaultOperator: {
              include: { member: { include: { user: true } } },
            },
            operators: {
              include: { member: { include: { user: true } } },
            },
          },
        });
      }
    }

    if (!settings && (db as any).bakerySettings) {
      settings = await (db as any).bakerySettings.findUnique({
        where: { organizationId: session.organizationId },
        include: {
          defaultBaker: {
            include: { member: { include: { user: true } } },
          },
          bakers: {
            include: { member: { include: { user: true } } },
          },
        },
      });
    }

    if (settings) {
      settings.defaultOperatorId = settings.defaultOperatorId || settings.defaultBakerId;
      settings.defaultBakerId = settings.defaultOperatorId || settings.defaultBakerId;
      settings.operators = settings.operators || settings.bakers;
    }

    return { success: true, settings };
  } catch (error: any) {
    console.error("Error fetching production settings:", error);
    return { success: false, error: error.message || "Failed to fetch settings" };
  }
}

export async function updateProductionSettingsAction(
  data: ProductionSettingsData,
): Promise<{ success: boolean; settings?: any; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const payload: any = { ...data };
    if (payload.defaultBakerId && !payload.defaultOperatorId) {
      payload.defaultOperatorId = payload.defaultBakerId;
    }

    let updated: any = null;
    if ((db as any).productionSettings) {
      const prodData = { ...payload };
      delete prodData.defaultBakerId;
      updated = await (db as any).productionSettings.upsert({
        where: { organizationId: session.organizationId },
        update: prodData,
        create: {
          organizationId: session.organizationId,
          ...prodData,
        },
      });
    }

    if ((db as any).bakerySettings) {
      const bakeryData = { ...payload };
      delete bakeryData.defaultOperatorId;
      await (db as any).bakerySettings.upsert({
        where: { organizationId: session.organizationId },
        update: bakeryData,
        create: {
          organizationId: session.organizationId,
          ...bakeryData,
        },
      }).catch(() => null);
    }

    revalidatePath("/settings");
    revalidatePath("/settings/production");
    return { success: true, settings: updated };
  } catch (error: any) {
    console.error("Error updating production settings:", error);
    return { success: false, error: error.message || "Failed to update production settings" };
  }
}
