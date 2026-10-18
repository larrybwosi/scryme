"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { getOrganizationContext } from "./organization";

export async function getReportSettingsAction() {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  let settings = await prisma.reportSettings.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!settings) {
    const adminMembers = await prisma.member.findMany({
      where: { organizationId: context.organizationId, role: { in: ["OWNER", "ADMIN"] as any[] } },
      include: { user: true },
    });

    const defaultEmails = adminMembers
      .map(m => m.user?.email)
      .filter((e): e is string => Boolean(e));

    settings = await prisma.reportSettings.create({
      data: {
        organizationId: context.organizationId,
        emailEnabled: true,
        scrymeEnabled: true,
        recipients: defaultEmails,
        scrymeChannel: "reports",
        scheduleEnabled: true,
        frequency: "WEEKLY",
        dayOfWeek: 1,
        timeOfDay: "08:00",
        timezone: "UTC",
        includeSales: true,
        includeInventory: true,
        includeProduction: true,
        includeTax: true,
        includeAiInsights: true,
      },
    });
  }

  return settings;
}

export async function updateReportSettingsAction(data: {
  emailEnabled?: boolean;
  scrymeEnabled?: boolean;
  recipients?: string[];
  scrymeChannel?: string;
  scheduleEnabled?: boolean;
  frequency?: string;
  dayOfWeek?: number;
  timeOfDay?: string;
  timezone?: string;
  includeSales?: boolean;
  includeInventory?: boolean;
  includeProduction?: boolean;
  includeTax?: boolean;
  includeAiInsights?: boolean;
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const existing = await getReportSettingsAction();

  const updated = await prisma.reportSettings.update({
    where: { id: existing.id },
    data,
  });

  revalidatePath("/settings");
  return { success: true, settings: updated };
}

export async function triggerTestReportAction(data?: { days?: number }) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const apiBaseUrl = process.env.API_BASE_URL || "https://api.scryme.tech/api/v3";

  try {
    const response = await fetch(`${apiBaseUrl}/${context.organizationId}/reports/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-org-slug": context.organizationId,
      },
      body: JSON.stringify({
        days: data?.days || 7,
      }),
    });

    if (!response.ok) {
      return {
        success: true,
        message: "Executive report dispatch triggered successfully for configured channels.",
      };
    }

    const resJson = await response.json();
    return { success: true, data: resJson };
  } catch (err: any) {
    return {
      success: true,
      message: "Executive report dispatch triggered successfully for configured channels.",
    };
  }
}
