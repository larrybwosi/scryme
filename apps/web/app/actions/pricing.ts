"use server";

import { db, Decimal, PricingMethod, RoundingMethod, PriceApprovalStatus, DiscountType } from "@repo/db";
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
        select: { items: true, customers: true }
      }
    },
    orderBy: {
      priority: 'desc'
    }
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
              product: true
            }
          },
          sellingUnit: {
            include: {
              systemUnit: true,
              orgUnit: true
            }
          }
        }
      },
      rules: true,
    }
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
  if (!context?.organizationId) throw new Error("Unauthorized");

  const priceList = await db.priceList.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      approvalStatus: PriceApprovalStatus.APPROVED, // Automatically approved for now as per requirements "Just creating new"
    },
  });

  revalidatePath("/inventory/pricelists");
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

export async function addPriceListItems(priceListId: string, items: Array<{
  variantId: string;
  sellingUnitId?: string | null;
  method: PricingMethod;
  percentageValue?: number | null;
  price: number;
  minQuantity?: number;
}>) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.$transaction(
    items.map(item => db.priceListItem.upsert({
      where: {
        priceListId_variantId_sellingUnitId_minQuantity: {
          priceListId,
          variantId: item.variantId,
          sellingUnitId: item.sellingUnitId!,
          minQuantity: item.minQuantity ?? 1,
        }
      },
      create: {
        ...item,
        priceListId,
        price: new Decimal(item.price),
        percentageValue: item.percentageValue ? new Decimal(item.percentageValue) : null,
      },
      update: {
        ...item,
        price: new Decimal(item.price),
        percentageValue: item.percentageValue ? new Decimal(item.percentageValue) : null,
      }
    }))
  );

  revalidatePath(`/inventory/pricelists/${priceListId}`);
  return result;
}

export async function removePriceListItem(id: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const item = await db.priceListItem.delete({
    where: { id },
    select: { priceListId: true }
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
    select: { tags: true }
  });

  const tags = new Set<string>();
  customers.forEach(c => c.tags.forEach(t => {
    if (t) tags.add(t);
  }));

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
              orgUnit: true
            }
          }
        }
      }
    }
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
