"use server";

import { db, PricingModel, DepositType, Decimal } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

// ─── Service Category Actions ──────────────────────────────────────────────────

export async function getServiceCategories() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.serviceCategory.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createServiceCategory(data: {
  name: string;
  description?: string;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const category = await db.serviceCategory.create({
    data: {
      name: data.name,
      description: data.description,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/inventory/services");
  return category;
}

export async function updateServiceCategory(
  id: string,
  data: {
    name: string;
    description?: string;
  },
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const category = await db.serviceCategory.update({
    where: {
      id,
      organizationId: context.organizationId,
    },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  revalidatePath("/inventory/services");
  return category;
}

export async function deleteServiceCategory(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.serviceCategory.delete({
    where: {
      id,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/inventory/services");
  return { success: true };
}

// ─── Service Actions ───────────────────────────────────────────────────────────

export async function getServices() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.service.findMany({
    where: { organizationId: context.organizationId },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getService(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  return db.service.findFirst({
    where: {
      id,
      organizationId: context.organizationId,
    },
    include: {
      category: true,
    },
  });
}

export async function createService(data: {
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  pricingModel: PricingModel;
  price: number;
  minPrice?: number;
  estimatedDuration?: number;
  requiresDeposit?: boolean;
  depositAmount?: number;
  depositType?: DepositType;
  isActive?: boolean;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const service = await db.service.create({
    data: {
      name: data.name,
      description: data.description,
      sku: data.sku,
      categoryId: data.categoryId,
      pricingModel: data.pricingModel,
      price: new Decimal(data.price),
      minPrice: data.minPrice !== undefined && data.minPrice !== null ? new Decimal(data.minPrice) : null,
      estimatedDuration: data.estimatedDuration ?? null,
      requiresDeposit: data.requiresDeposit ?? false,
      depositAmount: data.depositAmount !== undefined && data.depositAmount !== null ? new Decimal(data.depositAmount) : null,
      depositType: data.depositType ?? DepositType.FIXED,
      isActive: data.isActive ?? true,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/inventory/services");
  return service;
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    description?: string;
    sku?: string;
    categoryId?: string;
    pricingModel?: PricingModel;
    price?: number;
    minPrice?: number | null;
    estimatedDuration?: number;
    requiresDeposit?: boolean;
    depositAmount?: number | null;
    depositType?: DepositType;
    isActive?: boolean;
    customFields?: any;
  },
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const service = await db.service.update({
    where: {
      id,
      organizationId: context.organizationId,
    },
    data: {
      name: data.name,
      description: data.description,
      sku: data.sku,
      categoryId: data.categoryId,
      pricingModel: data.pricingModel,
      price: data.price !== undefined ? new Decimal(data.price) : undefined,
      minPrice: data.minPrice !== undefined && data.minPrice !== null ? new Decimal(data.minPrice) : (data.minPrice === null ? null : undefined),
      estimatedDuration: data.estimatedDuration !== undefined ? data.estimatedDuration : undefined,
      requiresDeposit: data.requiresDeposit,
      depositAmount: data.depositAmount !== undefined && data.depositAmount !== null ? new Decimal(data.depositAmount) : (data.depositAmount === null ? null : undefined),
      depositType: data.depositType,
      isActive: data.isActive,
      customFields: data.customFields !== undefined ? data.customFields : undefined,
    },
  });

  revalidatePath("/inventory/services");
  revalidatePath(`/inventory/services/${id}`);
  return service;
}

export async function deleteService(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.service.delete({
    where: {
      id,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/inventory/services");
  return { success: true };
}
