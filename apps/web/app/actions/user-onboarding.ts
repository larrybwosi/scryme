"use server";

import { db as prisma } from "@repo/db";
import { getOrganizationContext } from "./auth";

export interface OnboardingStatus {
  completed: boolean;
  skipped: boolean;
  completedAt?: string;
}

export async function getUserOnboardingStatus(): Promise<{
  success: boolean;
  data?: OnboardingStatus;
  error?: string;
}> {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx || !ctx.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { notificationPrefs: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const prefs = (user.notificationPrefs as Record<string, any>) || {};
    const orgKey = ctx.organizationId ? `org_${ctx.organizationId}` : "default";
    const onboarding = prefs.onboarding?.[orgKey] || prefs.onboarding?.global || {
      completed: false,
      skipped: false,
    };

    return {
      success: true,
      data: {
        completed: Boolean(onboarding.completed),
        skipped: Boolean(onboarding.skipped),
        completedAt: onboarding.completedAt,
      },
    };
  } catch (error: any) {
    console.error("Error fetching onboarding status:", error);
    return { success: false, error: error?.message || "Failed to fetch onboarding status" };
  }
}

export async function updateUserOnboardingStatus(params: {
  completed?: boolean;
  skipped?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx || !ctx.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { notificationPrefs: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const currentPrefs = (user.notificationPrefs as Record<string, any>) || {};
    const orgKey = ctx.organizationId ? `org_${ctx.organizationId}` : "default";

    const currentOnboarding = currentPrefs.onboarding || {};
    const orgOnboarding = currentOnboarding[orgKey] || {};

    const updatedOrgOnboarding = {
      ...orgOnboarding,
      ...(params.completed !== undefined ? { completed: params.completed } : {}),
      ...(params.skipped !== undefined ? { skipped: params.skipped } : {}),
      updatedAt: new Date().toISOString(),
      ...(params.completed ? { completedAt: new Date().toISOString() } : {}),
    };

    const newPrefs = {
      ...currentPrefs,
      onboarding: {
        ...currentOnboarding,
        [orgKey]: updatedOrgOnboarding,
      },
    };

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        notificationPrefs: newPrefs,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating onboarding status:", error);
    return { success: false, error: error?.message || "Failed to update onboarding status" };
  }
}
