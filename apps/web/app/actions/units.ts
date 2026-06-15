"use server";

import {
  db,
  Decimal,
  UnitType,
  IndustryCategory,
  Prisma,
} from "@repo/db";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";

export async function getSystemUnits() {
  return db.systemUnit.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getOrganizationUnits() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.organizationUnit.findMany({
    where: { organizationId: context.organizationId },
    include: {
      baseSystemUnit: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createOrganizationUnit(data: {
  name: string;
  symbol: string;
  abbreviation?: string;
  pluralName?: string;
  type: UnitType;
  category?: IndustryCategory;
  description?: string;
  baseSystemUnitId?: string;
  conversionFactor?: number;
  conversionOffset?: number;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const unit = await db.organizationUnit.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      conversionFactor: data.conversionFactor ? new Decimal(data.conversionFactor) : null,
      conversionOffset: data.conversionOffset ? new Decimal(data.conversionOffset) : new Decimal(0),
    },
  });

  revalidatePath("/inventory/units");
  return unit;
}

export async function updateOrganizationUnit(
  id: string,
  data: {
    name?: string;
    symbol?: string;
    abbreviation?: string;
    pluralName?: string;
    type?: UnitType;
    category?: IndustryCategory;
    description?: string;
    isActive?: boolean;
    baseSystemUnitId?: string;
    conversionFactor?: number;
    conversionOffset?: number;
  }
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const unit = await db.organizationUnit.update({
    where: { id, organizationId: context.organizationId },
    data: {
      ...data,
      conversionFactor: data.conversionFactor !== undefined ? (data.conversionFactor ? new Decimal(data.conversionFactor) : null) : undefined,
      conversionOffset: data.conversionOffset !== undefined ? new Decimal(data.conversionOffset) : undefined,
    },
  });

  revalidatePath("/inventory/units");
  return unit;
}

export async function deleteOrganizationUnit(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // Check if it's being used?
  // For now, let's just delete, but in a real enterprise app we might want to check relations.
  // The schema has relations to ProductVariant, StockBatch, etc.

  await db.organizationUnit.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/units");
}

export async function bulkUpdateOrgUnitsStatus(ids: string[], isActive: boolean) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.organizationUnit.updateMany({
    where: {
      id: { in: ids },
      organizationId: context.organizationId,
    },
    data: { isActive },
  });

  revalidatePath("/inventory/units");
}

export async function getOrgUnitConversions() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.orgUnitConversion.findMany({
    where: { organizationId: context.organizationId },
    include: {
      fromUnit: true,
      toUnit: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrgUnitConversion(data: {
  fromUnitId: string;
  toUnitId: string;
  factor: number;
  offset?: number;
  isApproximate?: boolean;
  notes?: string;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const conversion = await db.orgUnitConversion.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      factor: new Decimal(data.factor),
      offset: data.offset ? new Decimal(data.offset) : new Decimal(0),
    },
  });

  revalidatePath("/inventory/units");
  return conversion;
}

export async function updateOrgUnitConversion(
  id: string,
  data: {
    factor?: number;
    offset?: number;
    isApproximate?: boolean;
    notes?: string;
    isActive?: boolean;
  }
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const conversion = await db.orgUnitConversion.update({
    where: { id, organizationId: context.organizationId },
    data: {
      ...data,
      factor: data.factor !== undefined ? new Decimal(data.factor) : undefined,
      offset: data.offset !== undefined ? new Decimal(data.offset) : undefined,
    },
  });

  revalidatePath("/inventory/units");
  return conversion;
}

export async function deleteOrgUnitConversion(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.orgUnitConversion.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/units");
}
