"use server";

import {
  db,
  Decimal,
  PricingMethod,
  RoundingMethod,
  PriceApprovalStatus,
  DiscountType,
} from "@repo/db";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";

export async function getPriceLists() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.priceList.findMany({
    where: {
      organizationId: context.organizationId,
    },
    include: {
      _count: {
        select: { items: true, customers: true },
      },
    },
    orderBy: {
      priority: "desc",
    },
  });
}

export async function getPriceList(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  return db.priceList.findUnique({
    where: {
      id,
      organizationId: context.organizationId,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
          sellingUnit: {
            include: {
              systemUnit: true,
              orgUnit: true,
            },
          },
        },
      },
      rules: true,
      customers: true,
    },
  });
}

export async function createPriceList(data: {
  name: string;
  description?: string;
  code: string;
  currency?: string;
  isGlobal?: boolean;
  priority?: number;
  validFrom?: Date | null;
  validTo?: Date | null;
  customerTags?: string[];
}) {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const priceList = await db.priceList.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      approvalStatus: PriceApprovalStatus.DRAFT,
      submittedBy: context.memberId,
    },
  });

  revalidatePath("/inventory/pricelists");
  return priceList;
}

export async function submitPriceListForApproval(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const priceList = await db.priceList.update({
    where: { id, organizationId: context.organizationId },
    data: {
      approvalStatus: PriceApprovalStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
      submittedBy: context.memberId,
    },
  });

  revalidatePath("/inventory/pricelists");
  revalidatePath(`/inventory/pricelists/${id}`);
  return priceList;
}

export async function approvePriceList(id: string, notes?: string) {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const priceList = await db.priceList.update({
    where: { id, organizationId: context.organizationId },
    data: {
      approvalStatus: PriceApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: context.memberId,
      approvalNotes: notes,
    },
  });

  revalidatePath("/inventory/pricelists");
  revalidatePath(`/inventory/pricelists/${id}`);
  return priceList;
}

export async function rejectPriceList(id: string, notes: string) {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const priceList = await db.priceList.update({
    where: { id, organizationId: context.organizationId },
    data: {
      approvalStatus: PriceApprovalStatus.REJECTED,
      approvalNotes: notes,
    },
  });

  revalidatePath("/inventory/pricelists");
  revalidatePath(`/inventory/pricelists/${id}`);
  return priceList;
}

export async function updatePriceList(id: string, data: any) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const priceList = await db.priceList.update({
    where: { id, organizationId: context.organizationId },
    data,
  });

  revalidatePath("/inventory/pricelists");
  revalidatePath(`/inventory/pricelists/${id}`);
  return priceList;
}

export async function deletePriceList(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.priceList.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/pricelists");
}

export async function addPriceListItems(
  priceListId: string,
  items: Array<{
    variantId: string;
    sellingUnitId?: string | null;
    method: PricingMethod;
    percentageValue?: number | null;
    price: number;
    minQuantity?: number;
  }>,
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.$transaction(
    items.map(item => {
      const where = item.sellingUnitId
        ? {
            priceListId_variantId_sellingUnitId_minQuantity: {
              priceListId,
              variantId: item.variantId,
              sellingUnitId: item.sellingUnitId,
              minQuantity: item.minQuantity ?? 1,
            },
          }
        : {
            priceListId_variantId_minQuantity: {
              priceListId,
              variantId: item.variantId,
              minQuantity: item.minQuantity ?? 1,
            },
          };

      return db.priceListItem.upsert({
        where,
        create: {
          ...item,
          priceListId,
          price: new Decimal(item.price),
          percentageValue: item.percentageValue
            ? new Decimal(item.percentageValue)
            : null,
        },
        update: {
          ...item,
          price: new Decimal(item.price),
          percentageValue: item.percentageValue
            ? new Decimal(item.percentageValue)
            : null,
        },
      });
    }),
  );

  revalidatePath(`/inventory/pricelists/${priceListId}`);
  return result;
}

export async function removePriceListItem(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const item = await db.priceListItem.delete({
    where: { id },
    select: { priceListId: true },
  });

  if (item?.priceListId) {
    revalidatePath(`/inventory/pricelists/${item.priceListId}`);
  }
}

export async function getUniqueCustomerTags() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const customers = await db.customer.findMany({
    where: { organizationId: context.organizationId },
    select: { tags: true },
  });

  const tags = new Set<string>();
  customers.forEach((c: any) =>
    c.tags.forEach((t: any) => {
      if (t) tags.add(t);
    }),
  );

  return Array.from(tags);
}

export async function getProductsForPricing() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.product.findMany({
    where: { organizationId: context.organizationId },
    include: {
      variants: {
        include: {
          sellingUnits: {
            include: {
              systemUnit: true,
              orgUnit: true,
            },
          },
        },
      },
    },
  });
}

export async function createPricingRule(data: {
  priceListId: string;
  name: string;
  description?: string;
  variantId?: string | null;
  categoryId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  priority?: number;
  stackable?: boolean;
  validFrom?: Date | null;
  validTo?: Date | null;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const rule = await db.pricingRule.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      discountValue: new Decimal(data.discountValue),
    },
  });

  revalidatePath(`/inventory/pricelists/${data.priceListId}`);
  return rule;
}

export async function getCustomers() {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.customer.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function assignCustomersToPriceList(
  priceListId: string,
  customerIds: string[],
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.priceList.update({
    where: { id: priceListId, organizationId: context.organizationId },
    data: {
      customers: {
        connect: customerIds.map(id => ({ id })),
      },
    },
  });

  revalidatePath(`/inventory/pricelists/${priceListId}`);
  return result;
}

export async function removeCustomerFromPriceList(
  priceListId: string,
  customerId: string,
) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.priceList.update({
    where: { id: priceListId, organizationId: context.organizationId },
    data: {
      customers: {
        disconnect: { id: customerId },
      },
    },
  });

  revalidatePath(`/inventory/pricelists/${priceListId}`);
  return result;
}
