"use server";

import { db, Decimal, PricingMethod, RoundingMethod, PriceApprovalStatus, DiscountType, BundleType } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";
import { realtimeService } from "@repo/shared/realtime";

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
      customers: true,
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
  if (!context?.organizationId || !context.memberId) throw new Error("Unauthorized");

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
  if (!context?.organizationId || !context.memberId) throw new Error("Unauthorized");

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
  if (!context?.organizationId || !context.memberId) throw new Error("Unauthorized");

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
  if (!context?.organizationId || !context.memberId) throw new Error("Unauthorized");

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

  await realtimeService.publish(
    `organization:${context.organizationId}:pricing`,
    "price-list-deleted",
    { priceListId: id },
  );

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
    items.map(item => {
      const where = item.sellingUnitId
        ? {
            priceListId_variantId_sellingUnitId_minQuantity: {
              priceListId,
              variantId: item.variantId,
              sellingUnitId: item.sellingUnitId,
              minQuantity: item.minQuantity ?? 1,
            }
          }
        : {
            priceListId_variantId_minQuantity: {
              priceListId,
              variantId: item.variantId,
              minQuantity: item.minQuantity ?? 1,
            }
          };

      return db.priceListItem.upsert({
        where,
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
      });
    })
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
  customers.forEach((c: any) => c.tags.forEach((t: any) => {
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

export async function assignCustomersToPriceList(priceListId: string, customerIds: string[]) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.priceList.update({
    where: { id: priceListId, organizationId: context.organizationId },
    data: {
      customers: {
        connect: customerIds.map(id => ({ id }))
      }
    }
  });

  revalidatePath(`/inventory/pricelists/${priceListId}`);
  return result;
}

export async function removeCustomerFromPriceList(priceListId: string, customerId: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.priceList.update({
    where: { id: priceListId, organizationId: context.organizationId },
    data: {
      customers: {
        disconnect: { id: customerId }
      }
    }
  });

  revalidatePath(`/inventory/pricelists/${priceListId}`);
  return result;
}


export async function getOrCreateDefaultPriceList() {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  let defaultList = await db.priceList.findFirst({
    where: {
      organizationId: context.organizationId,
      isGlobal: true,
    },
    orderBy: { priority: "desc" },
  });

  if (!defaultList) {
    defaultList = await db.priceList.create({
      data: {
        organizationId: context.organizationId,
        name: "Standard Store Price List",
        code: `STD_LIST_${Date.now()}`,
        isGlobal: true,
        priority: 0,
        approvalStatus: PriceApprovalStatus.APPROVED,
      },
    });
  }

  return defaultList;
}

export async function getProductPricingDetails(productId: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  const product = await db.product.findFirst({
    where: { id: productId, organizationId: context.organizationId },
    select: { id: true, categoryId: true },
  });

  if (!product) return null;

  const variants = await db.productVariant.findMany({
    where: { productId },
    select: { id: true, name: true, sku: true, retailPrice: true, buyingPrice: true },
  });

  const variantIds = variants.map(v => v.id);

  const priceListItems = await db.priceListItem.findMany({
    where: {
      variantId: { in: variantIds },
      priceList: { organizationId: context.organizationId },
    },
    include: {
      priceList: { select: { id: true, name: true, isGlobal: true } },
      variant: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { minQuantity: "asc" },
  });

  const pricingRules = await db.pricingRule.findMany({
    where: {
      organizationId: context.organizationId,
      OR: [
        { variantId: { in: variantIds } },
        { categoryId: product.categoryId },
      ],
    },
    include: {
      priceList: { select: { id: true, name: true } },
      variant: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { priority: "desc" },
  });

  const bundleItems = await db.pricingBundleItem.findMany({
    where: { variantId: { in: variantIds } },
    include: {
      bundle: {
        include: {
          items: {
            include: {
              variant: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      },
    },
  });

  const bundlesMap = new Map();
  bundleItems.forEach(bi => {
    if (bi.bundle && !bundlesMap.has(bi.bundle.id)) {
      bundlesMap.set(bi.bundle.id, bi.bundle);
    }
  });

  const priceLists = await db.priceList.findMany({
    where: { organizationId: context.organizationId, isActive: true },
    select: { id: true, name: true, code: true, isGlobal: true },
  });

  return {
    priceListItems,
    pricingRules,
    bundles: Array.from(bundlesMap.values()),
    priceLists,
  };
}

export async function createVolumeTierForProduct(data: {
  productId: string;
  variantId: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  wholesalePrice?: number | null;
  priceListId?: string;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  let listId = data.priceListId;
  if (!listId) {
    const defaultList = await getOrCreateDefaultPriceList();
    listId = defaultList.id;
  }

  const existing = await db.priceListItem.findFirst({
    where: {
      priceListId: listId,
      variantId: data.variantId,
      minQuantity: data.minQuantity,
    },
  });

  let item;
  if (existing) {
    item = await db.priceListItem.update({
      where: { id: existing.id },
      data: {
        price: new Decimal(data.price),
        maxQuantity: data.maxQuantity ?? null,
        wholesalePrice: data.wholesalePrice ? new Decimal(data.wholesalePrice) : null,
      },
    });
  } else {
    item = await db.priceListItem.create({
      data: {
        priceListId: listId,
        variantId: data.variantId,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity ?? null,
        price: new Decimal(data.price),
        wholesalePrice: data.wholesalePrice ? new Decimal(data.wholesalePrice) : null,
      },
    });
  }

  revalidatePath(`/inventory/products/${data.productId}`);
  return item;
}

export async function deleteVolumeTier(priceListItemId: string, productId?: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.priceListItem.delete({
    where: { id: priceListItemId },
  });

  if (productId) {
    revalidatePath(`/inventory/products/${productId}`);
  }
}

export async function createProductPricingRule(data: {
  productId: string;
  variantId?: string | null;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minQuantity?: number | null;
  minOrderValue?: number | null;
  priceListId?: string;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  let listId = data.priceListId;
  if (!listId) {
    const defaultList = await getOrCreateDefaultPriceList();
    listId = defaultList.id;
  }

  const conditions: Record<string, any> = {};
  if (data.minQuantity) conditions.minQuantity = data.minQuantity;
  if (data.minOrderValue) conditions.minOrderValue = data.minOrderValue;

  const rule = await db.pricingRule.create({
    data: {
      organizationId: context.organizationId,
      priceListId: listId,
      variantId: data.variantId || null,
      name: data.name,
      description: data.description || null,
      discountType: data.discountType,
      discountValue: new Decimal(data.discountValue),
      conditions,
    },
  });

  revalidatePath(`/inventory/products/${data.productId}`);
  return rule;
}

export async function deleteProductPricingRule(ruleId: string, productId?: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.pricingRule.delete({
    where: { id: ruleId, organizationId: context.organizationId },
  });

  if (productId) {
    revalidatePath(`/inventory/products/${productId}`);
  }
}

export async function createProductPricingBundle(data: {
  productId: string;
  variantId: string;
  name: string;
  description?: string;
  bundleType: BundleType;
  bundlePrice?: number | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  getDiscountType?: DiscountType | null;
  getDiscountValue?: number | null;
}) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const bundleCode = `BDL_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const bundle = await db.pricingBundle.create({
    data: {
      organizationId: context.organizationId,
      name: data.name,
      code: bundleCode,
      description: data.description || null,
      bundleType: data.bundleType,
      bundlePrice: data.bundlePrice ? new Decimal(data.bundlePrice) : null,
      buyQuantity: data.buyQuantity ?? null,
      getQuantity: data.getQuantity ?? null,
      getDiscountType: data.getDiscountType ?? null,
      getDiscountValue: data.getDiscountValue ? new Decimal(data.getDiscountValue) : null,
      items: {
        create: [
          {
            variantId: data.variantId,
            quantity: data.buyQuantity || 1,
            itemRole: data.bundleType === BundleType.DYNAMIC ? "BUY" : null,
          },
        ],
      },
    },
  });

  revalidatePath(`/inventory/products/${data.productId}`);
  return bundle;
}

export async function deleteProductPricingBundle(bundleId: string, productId?: string) {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.pricingBundle.delete({
    where: { id: bundleId, organizationId: context.organizationId },
  });

  if (productId) {
    revalidatePath(`/inventory/products/${productId}`);
  }
}
