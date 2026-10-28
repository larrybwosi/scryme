"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { encryptV3, decryptV3 } from "@repo/shared/api/v3";
import { evaluateAllModulesStatus, EffectiveModuleResolution } from "@repo/shared/constants";

const MASK_STRING = "••••••••";

/**
 * Retrieves the active organization for the authenticated user, cached via unstable_cache.
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
            include: { settings: true, paymentCredentials: true },
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
          include: { settings: true, paymentCredentials: true },
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
        include: { settings: true, paymentCredentials: true },
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

/**
 * Creates a new organization for the authenticated user.
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  industry: string;
  size: string;
}): Promise<any> {
  const auth = await getServerAuth({ allowNoOrg: true });
  if (!auth) throw new Error("Unauthorized");

  const organization = await db.$transaction(async tx => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: `${data.industry} - ${data.size}`,
        members: {
          create: {
            userId: auth.user.id,
            role: "OWNER",
          },
        },
      },
    });

    const defaultLocation = await tx.inventoryLocation.create({
      data: {
        name: "Main branch",
        code: `MAIN-${org.slug.toUpperCase()}`,
        locationType: "RETAIL_SHOP",
        isDefault: true,
        organizationId: org.id,
      },
    });

    // Pre-create default organization settings
    await tx.organizationSettings.create({
      data: {
        organizationId: org.id,
        adminsCanManageStaff: false,
        managersCanManageShifts: false,
      },
    });

    // Create 14-day free trial subscription
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    await tx.subscription.create({
      data: {
        organizationId: org.id,
        status: "TRIALING",
        trialStartedAt,
        trialEndsAt,
      },
    });

    return tx.organization.update({
      where: { id: org.id },
      data: {
        defaultLocationId: defaultLocation.id,
      },
    });
  });

  // Update user's active organization
  await db.user.update({
    where: { id: auth.user.id },
    data: { activeOrganizationId: organization.id },
  });

  // Clear session cache to reflect the new organization immediately
  try {
    const { getRedisClient } = await import("@repo/shared/redis");
    const redis = await getRedisClient();
    await redis.del(`session-cache:${auth.user.id}`);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }

  revalidateTag(`active-org:${auth.user.id}`, "max");
  revalidatePath("/");
  return organization;
}

export async function updateOrganizationSettings(data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  banner?: string;
  paymentCredentials?: {
    mpesaShortCode?: string;
    mpesaType?: string;
    mpesaConsumerKey?: string;
    mpesaConsumerSecret?: string;
    mpesaPassKey?: string;
    mpesaInitiatorPass?: string;
    environment?: "SANDBOX" | "PRODUCTION";
  };
  [key: string]: any;
}): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const { name, email, phone, address, logo, banner, paymentCredentials, ...settingsData } = data;

  const result = await db.$transaction(async tx => {
    const org = await tx.organization.update({
      where: { id: auth.organizationId },
      data: {
        name,
        email,
        phone,
        address,
        logo,
        banner,
      },
    });

    let settings = null;
    if (Object.keys(settingsData).length > 0) {
      settings = await tx.organizationSettings.upsert({
        where: { organizationId: auth.organizationId },
        update: settingsData,
        create: {
          ...settingsData,
          organizationId: auth.organizationId,
        },
      });
    }

    let updatedPaymentCreds = null;
    if (paymentCredentials) {
      const existingCreds = await tx.paymentCredentials.findUnique({
        where: { organizationId: auth.organizationId },
      });

      // Helper to determine string encryption update or preserve existing encrypted value
      const getEncryptedValue = (newValue?: string, existingEncrypted?: string | null) => {
        if (!newValue || newValue === MASK_STRING) {
          return existingEncrypted || "";
        }
        return encryptV3(newValue);
      };

      const mpesaConsumerKey = getEncryptedValue(
        paymentCredentials.mpesaConsumerKey,
        existingCreds?.mpesaConsumerKey
      );
      const mpesaConsumerSecret = getEncryptedValue(
        paymentCredentials.mpesaConsumerSecret,
        existingCreds?.mpesaConsumerSecret
      );
      const mpesaPassKey = paymentCredentials.mpesaPassKey
        ? getEncryptedValue(paymentCredentials.mpesaPassKey, existingCreds?.mpesaPassKey)
        : existingCreds?.mpesaPassKey || null;
      const mpesaInitiatorPass = paymentCredentials.mpesaInitiatorPass
        ? getEncryptedValue(paymentCredentials.mpesaInitiatorPass, existingCreds?.mpesaInitiatorPass)
        : existingCreds?.mpesaInitiatorPass || null;

      updatedPaymentCreds = await tx.paymentCredentials.upsert({
        where: { organizationId: auth.organizationId },
        update: {
          mpesaShortCode: paymentCredentials.mpesaShortCode || existingCreds?.mpesaShortCode || "",
          mpesaType: paymentCredentials.mpesaType || existingCreds?.mpesaType || "PAYBILL",
          environment: paymentCredentials.environment || existingCreds?.environment || "SANDBOX",
          mpesaConsumerKey,
          mpesaConsumerSecret,
          mpesaPassKey,
          mpesaInitiatorPass,
        },
        create: {
          organizationId: auth.organizationId,
          mpesaShortCode: paymentCredentials.mpesaShortCode || "",
          mpesaType: paymentCredentials.mpesaType || "PAYBILL",
          environment: paymentCredentials.environment || "SANDBOX",
          mpesaConsumerKey,
          mpesaConsumerSecret,
          mpesaPassKey,
          mpesaInitiatorPass,
        },
      });
    }

    return { ...org, settings, paymentCredentials: updatedPaymentCreds };
  });

  revalidateTag(`active-org:${auth.user.id}`, "max");
  revalidateTag(`org:${auth.organizationId}`, "max");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return result;
}

export async function updateInvoiceTemplate(templateId: string): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const settings = await db.organizationSettings.update({
    where: { organizationId: auth.organizationId },
    data: {
      defaultInvoiceTemplate: templateId,
    },
  });

  revalidatePath("/settings/documents");
  return settings;
}

export async function updateDefaultDocumentTemplate(
  type: "INVOICE" | "RECEIPT" | "WAYBILL" | "DELIVERY_NOTE",
  templateId: string,
): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const fieldMap: Record<string, string> = {
    INVOICE: "defaultInvoiceTemplate",
    RECEIPT: "defaultReceiptTemplate",
    WAYBILL: "defaultWaybillTemplate",
    DELIVERY_NOTE: "defaultDeliveryNoteTemplate",
  };

  const field = fieldMap[type];
  if (!field) throw new Error("Invalid document type");

  // First, ensure settings exist
  await db.organizationSettings.upsert({
    where: { organizationId: auth.organizationId },
    update: {},
    create: {
      organizationId: auth.organizationId,
    },
  });

  const settings = await db.organizationSettings.update({
    where: { organizationId: auth.organizationId },
    data: {
      [field]: templateId,
    },
  });

  revalidatePath("/settings/documents");
  return settings;
}

export async function getOrganizationSettings(): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    include: {
      settings: true,
      paymentCredentials: true,
    },
  });

  if (org && org.paymentCredentials) {
    org.paymentCredentials = {
      ...org.paymentCredentials,
      mpesaConsumerKey: org.paymentCredentials.mpesaConsumerKey ? MASK_STRING : "",
      mpesaConsumerSecret: org.paymentCredentials.mpesaConsumerSecret ? MASK_STRING : "",
      mpesaPassKey: org.paymentCredentials.mpesaPassKey ? MASK_STRING : "",
      mpesaInitiatorPass: org.paymentCredentials.mpesaInitiatorPass ? MASK_STRING : "",
    };
  }

  return org;
}

export async function checkSlugAvailability(slug: string) {
  const existing = await db.organization.findUnique({
    where: { slug },
  });
  return !existing;
}

export async function getEffectiveModulesServerAction(): Promise<EffectiveModuleResolution[]> {
  const auth = await getServerAuth();
  if (!auth) return evaluateAllModulesStatus(null, null);

  const systemSetting = await db.globalSetting.findUnique({
    where: { key: "system:modules" },
  });

  let systemModules: Record<string, boolean> = {};
  if (systemSetting?.value) {
    try {
      systemModules = JSON.parse(systemSetting.value);
    } catch {
      systemModules = {};
    }
  }

  let orgModules: Record<string, boolean> = {};
  if (auth.organizationId) {
    const org = await db.organization.findUnique({
      where: { id: auth.organizationId },
      select: { quotaOverrides: true },
    });

    if (org?.quotaOverrides) {
      const overridesObj = org.quotaOverrides as Record<string, any>;
      if (overridesObj.bypassPaymentCheck) {
        return evaluateAllModulesStatus(systemModules, {}).map((m) => ({
          ...m,
          isEnabled: true,
          orgEnabled: true,
          reason: "Organization payment override enabled",
        }));
      }
      orgModules = (overridesObj.modules as Record<string, boolean>) || {};
    }
  }

  return evaluateAllModulesStatus(systemModules, orgModules);
}
