"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

/**
 * Creates a new organization for the authenticated user.
 *
 * NOTE: Returning 'any' to avoid portability issues with generated Prisma types in this monorepo structure.
 * The underlying return value is a 'Organization' object.
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  industry: string;
  size: string;
}): Promise<any> {
  const auth = await getServerAuth();
  if (!auth) throw new Error("Unauthorized");

  const organization = await db.$transaction(async (tx) => {
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
    const { getRedisClient } = await import("@repo/shared");
    const redis = await getRedisClient();
    await redis.del(`session-cache:${auth.user.id}`);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }

  revalidatePath("/");
  return organization;
}

export async function updateOrganizationSettings(data: {
  defaultCurrency?: string;
  defaultTimezone?: string;
  country?: string;
}): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const settings = await db.organizationSettings.upsert({
    where: { organizationId: auth.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: auth.organizationId,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return settings;
}

export async function updateOrganization(data: {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  banner?: string;
}): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const organization = await db.organization.update({
    where: { id: auth.organizationId },
    data,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return organization;
}

export async function uploadOrganizationAsset(
  formData: FormData,
  type: "logo" | "banner"
): Promise<string> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${type}-${auth.organizationId}-${Date.now()}-${file.name}`;

  const { storageService } = await import("@repo/shared");
  const result = await storageService.upload(buffer, filename, file.type);

  // Storage service might return an object with a URL or just the ID/URL
  const url = typeof result === "string" ? result : (result as any).url;

  await db.organization.update({
    where: { id: auth.organizationId },
    data: {
      [type]: url,
    },
  });

  revalidatePath("/settings");
  return url;
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

export async function getOrganizationSettings(): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  return db.organizationSettings.findUnique({
    where: { organizationId: auth.organizationId },
  });
}

export async function getInvoiceConfig(): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  return db.invoiceConfig.findUnique({
    where: { organizationId: auth.organizationId },
  });
}

export async function updateInvoiceConfig(data: {
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  footerText?: string;
  showTaxBreakdown?: boolean;
  showTerms?: boolean;
  showNotes?: boolean;
  showLineNumbers?: boolean;
}): Promise<any> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const config = await db.invoiceConfig.upsert({
    where: { organizationId: auth.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: auth.organizationId,
    },
  });

  revalidatePath("/settings/documents");
  return config;
}

export async function checkSlugAvailability(slug: string) {
  const existing = await db.organization.findUnique({
    where: { slug },
  });
  return !existing;
}
