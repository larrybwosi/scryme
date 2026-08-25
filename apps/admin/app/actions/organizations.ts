"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";
import { listTiers } from "./billing";

export async function listOrganizations() {
  await requireSuperAdmin();

  return db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, products: true },
      },
    },
  });
}

export async function getOrganizationDetails(id: string) {
  await requireSuperAdmin();

  const org = await db.organization.findUnique({
    where: { id },
    include: {
      settings: true,
      _count: {
        select: { members: true, products: true, transactions: true },
      },
    },
  });

  if (!org) {
    throw new Error(`Organization with ID ${id} not found`);
  }

  return org;
}

export async function createOrganization(input: {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}) {
  await requireSuperAdmin();

  const existing = await db.organization.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    throw new Error(`Organization slug "${input.slug}" is already taken`);
  }

  const org = await db.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        logo: input.logo,
        description: input.description,
      },
    });

    await tx.organizationSettings.create({
      data: {
        organizationId: created.id,
        defaultCurrency: "USD",
        defaultTimezone: "UTC",
      },
    });

    return created;
  });

  revalidatePath("/organizations");
  return org;
}

export async function updateOrganization(
  id: string,
  input: { name?: string; slug?: string; logo?: string; description?: string },
) {
  await requireSuperAdmin();
  await getOrganizationDetails(id);

  if (input.slug) {
    const existing = await db.organization.findFirst({
      where: { slug: input.slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Organization slug "${input.slug}" is already taken`);
    }
  }

  const org = await db.organization.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      logo: input.logo,
      description: input.description,
    },
  });

  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  return org;
}

export async function suspendOrganization(id: string, reason?: string) {
  await requireSuperAdmin();
  await getOrganizationDetails(id);

  const org = await db.organization.update({
    where: { id },
    data: {
      isSuspended: true,
      suspendedAt: new Date(),
      suspensionReason: reason || "Suspended by platform administrator",
    },
  });

  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  return org;
}

export async function reactivateOrganization(id: string) {
  await requireSuperAdmin();
  await getOrganizationDetails(id);

  const org = await db.organization.update({
    where: { id },
    data: {
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: null,
    },
  });

  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  return org;
}

export async function getEffectiveQuota(id: string) {
  await requireSuperAdmin();

  const org = await getOrganizationDetails(id);
  const subscription = await db.subscription.findUnique({
    where: { organizationId: id },
  });

  const tierSlug = subscription?.dodoPriceId || "free";
  const tiers = await listTiers();
  const tier = tiers.find((t) => t.slug === tierSlug);
  const baseLimits = tier?.limits || {};
  const overrides = (org.quotaOverrides as Record<string, any>) || {};

  return {
    organizationId: id,
    tierSlug,
    baseLimits,
    overrides,
    effectiveLimits: { ...baseLimits, ...overrides },
  };
}

export async function setQuotaOverrides(id: string, overrides: Record<string, any>) {
  await requireSuperAdmin();
  await getOrganizationDetails(id);

  await db.organization.update({
    where: { id },
    data: { quotaOverrides: overrides },
  });

  revalidatePath(`/organizations/${id}`);
  revalidatePath("/reports");
  return getEffectiveQuota(id);
}

export async function getOrganizationStorageUsage(id: string) {
  await requireSuperAdmin();
  await getOrganizationDetails(id);

  const [aggregate, org] = await Promise.all([
    db.attachment.aggregate({
      where: { organizationId: id },
      _sum: { sizeBytes: true },
      _count: { id: true },
    }),
    db.organization.findUnique({
      where: { id },
      select: { quotaOverrides: true },
    }),
  ]);

  const usedBytes = aggregate._sum.sizeBytes || 0;
  const fileCount = aggregate._count.id || 0;
  const overrides = (org?.quotaOverrides as Record<string, any>) || {};

  const limitMB =
    overrides.storageLimitMB != null
      ? Number(overrides.storageLimitMB)
      : overrides.storageLimitBytes != null
      ? Number(overrides.storageLimitBytes) / (1024 * 1024)
      : null;

  const isStorageDisabled = Boolean(overrides.storageDisabled);

  return {
    organizationId: id,
    usedBytes,
    usedMB: Math.round((usedBytes / (1024 * 1024)) * 100) / 100,
    usedGB: Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100,
    fileCount,
    limitMB,
    isStorageDisabled,
  };
}

export async function updateOrganizationStorageSettings(
  id: string,
  settings: { limitMB?: number | null; disableStorage?: boolean },
) {
  await requireSuperAdmin();
  const org = await getOrganizationDetails(id);

  const currentOverrides = (org.quotaOverrides as Record<string, any>) || {};
  const updatedOverrides = { ...currentOverrides };

  if (settings.limitMB === null || settings.limitMB === undefined) {
    delete updatedOverrides.storageLimitMB;
    delete updatedOverrides.storageLimitBytes;
  } else {
    updatedOverrides.storageLimitMB = settings.limitMB;
    updatedOverrides.storageLimitBytes = settings.limitMB * 1024 * 1024;
  }

  if (settings.disableStorage !== undefined) {
    updatedOverrides.storageDisabled = settings.disableStorage;
  }

  await db.organization.update({
    where: { id },
    data: { quotaOverrides: updatedOverrides },
  });

  revalidatePath(`/organizations/${id}`);
  revalidatePath("/reports");
  return getOrganizationStorageUsage(id);
}

export async function getOrganizationMembers(organizationId: string) {
  await requireSuperAdmin();

  return db.member.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isActive: true,
          banned: true,
        },
      },
    },
  });
}

export async function getPlatformStats() {
  await requireSuperAdmin();

  const [totalUsers, activeUsers, totalOrgs, totalMembers, activeDevices, totalConnectedApps] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true, banned: { not: true } } }),
      db.organization.count({ where: { deletedAt: null } }),
      db.member.count({ where: { isActive: true, deletedAt: null } }),
      db.deviceRegistry.count({ where: { status: "ACTIVE" } }),
      db.oAuthClient.count(),
    ]);

  return {
    totalUsers,
    activeUsers,
    totalOrganizations: totalOrgs,
    totalMembers,
    activeDevices,
    totalConnectedApps,
  };
}
