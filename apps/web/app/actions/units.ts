"use server";

import { db, Decimal, UnitType, IndustryCategory } from "@repo/db";
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
      conversionFactor: data.conversionFactor
        ? new Decimal(data.conversionFactor)
        : null,
      conversionOffset: data.conversionOffset
        ? new Decimal(data.conversionOffset)
        : new Decimal(0),
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
  },
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Hardening - OrganizationUnit lacks a composite unique constraint on [id, organizationId].
  // Standard Prisma update with non-unique where filters ignores non-unique fields at database level.
  // First verify existence/ownership, then update using updateMany scoped by organizationId.
  const existing = await db.organizationUnit.findFirst({
    where: { id, organizationId: context.organizationId },
  });
  if (!existing) throw new Error("Organization unit not found");

  await db.organizationUnit.updateMany({
    where: { id, organizationId: context.organizationId },
    data: {
      ...data,
      conversionFactor:
        data.conversionFactor !== undefined
          ? data.conversionFactor
            ? new Decimal(data.conversionFactor)
            : null
          : undefined,
      conversionOffset:
        data.conversionOffset !== undefined
          ? new Decimal(data.conversionOffset)
          : undefined,
    },
  });

  const unit = await db.organizationUnit.findFirstOrThrow({
    where: { id, organizationId: context.organizationId },
    include: { baseSystemUnit: true },
  });

  revalidatePath("/inventory/units");
  return unit;
}

export async function deleteOrganizationUnit(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Hardening - Use deleteMany scoped by id and organizationId
  // because OrganizationUnit lacks a composite unique constraint on [id, organizationId].
  const existing = await db.organizationUnit.findFirst({
    where: { id, organizationId: context.organizationId },
  });
  if (!existing) throw new Error("Organization unit not found");

  await db.organizationUnit.deleteMany({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/units");
}

export async function bulkUpdateOrgUnitsStatus(
  ids: string[],
  isActive: boolean,
) {
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

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Validate that both fromUnitId and toUnitId
  // belong to context.organizationId before creating unit conversion links across tenants.
  const [fromUnit, toUnit] = await Promise.all([
    db.organizationUnit.findFirst({
      where: { id: data.fromUnitId, organizationId: context.organizationId },
    }),
    db.organizationUnit.findFirst({
      where: { id: data.toUnitId, organizationId: context.organizationId },
    }),
  ]);

  if (!fromUnit || !toUnit) {
    throw new Error("Invalid fromUnit or toUnit for this organization");
  }

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
  },
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Hardening - OrgUnitConversion lacks a composite unique constraint on [id, organizationId].
  // Use findFirst pre-check followed by updateMany scoped by organizationId.
  const existing = await db.orgUnitConversion.findFirst({
    where: { id, organizationId: context.organizationId },
  });
  if (!existing) throw new Error("Conversion not found");

  await db.orgUnitConversion.updateMany({
    where: { id, organizationId: context.organizationId },
    data: {
      ...data,
      factor: data.factor !== undefined ? new Decimal(data.factor) : undefined,
      offset: data.offset !== undefined ? new Decimal(data.offset) : undefined,
    },
  });

  const conversion = await db.orgUnitConversion.findFirstOrThrow({
    where: { id, organizationId: context.organizationId },
    include: { fromUnit: true, toUnit: true },
  });

  revalidatePath("/inventory/units");
  return conversion;
}

export async function deleteOrgUnitConversion(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  // 🛡️ Sentinel: BOLA/IDOR Hardening - Use deleteMany scoped by id and organizationId
  // because OrgUnitConversion lacks a composite unique constraint on [id, organizationId].
  const existing = await db.orgUnitConversion.findFirst({
    where: { id, organizationId: context.organizationId },
  });
  if (!existing) throw new Error("Conversion not found");

  await db.orgUnitConversion.deleteMany({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/units");
}
