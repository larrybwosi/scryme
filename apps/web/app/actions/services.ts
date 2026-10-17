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

  // 🛡️ Sentinel: BOLA/IDOR Protection - Use updateMany scoped by id and organizationId
  // because ServiceCategory model lacks a composite unique constraint on [id, organizationId].
  const result = await db.serviceCategory.updateMany({
    where: {
      id,
      organizationId: context.organizationId,
    },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  if (result.count === 0) throw new Error("Service category not found");

  const category = await db.serviceCategory.findFirstOrThrow({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/services");
  return category;
}

export async function deleteServiceCategory(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Protection - Use deleteMany scoped by id and organizationId
  // because ServiceCategory model lacks a composite unique constraint on [id, organizationId].
  const result = await db.serviceCategory.deleteMany({
    where: {
      id,
      organizationId: context.organizationId,
    },
  });

  if (result.count === 0) throw new Error("Service category not found");

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

  // 🛡️ Sentinel: BOLA/IDOR Protection - Ensure category belongs to the authenticated organization
  const category = await db.serviceCategory.findFirst({
    where: {
      id: data.categoryId,
      organizationId: context.organizationId,
    },
  });
  if (!category) throw new Error("Invalid service category");

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

  if (data.categoryId) {
    // 🛡️ Sentinel: BOLA/IDOR Protection - Ensure target category belongs to the authenticated organization
    const category = await db.serviceCategory.findFirst({
      where: {
        id: data.categoryId,
        organizationId: context.organizationId,
      },
    });
    if (!category) throw new Error("Invalid service category");
  }

  // 🛡️ Sentinel: BOLA/IDOR Protection - Use updateMany scoped by id and organizationId
  // because Service model lacks a composite unique constraint on [id, organizationId].
  const result = await db.service.updateMany({
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

  if (result.count === 0) throw new Error("Service not found");

  const service = await db.service.findFirstOrThrow({
    where: {
      id,
      organizationId: context.organizationId,
    },
    include: {
      category: true,
    },
  });

  revalidatePath("/inventory/services");
  revalidatePath(`/inventory/services/${id}`);
  return service;
}

export async function deleteService(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Protection - Use deleteMany scoped by id and organizationId
  // because Service model lacks a composite unique constraint on [id, organizationId].
  const result = await db.service.deleteMany({
    where: {
      id,
      organizationId: context.organizationId,
    },
  });

  if (result.count === 0) throw new Error("Service not found");

  revalidatePath("/inventory/services");
  return { success: true };
}
