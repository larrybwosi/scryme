"use server";

import { db, StockAdjustmentReason, MovementType, AdjustmentStatus, Decimal, StockAdjustment, ProductVariant } from "@repo/db";
import { Prisma } from "@repo/db";
import { getOrganizationContext } from "./auth";
import { revalidatePath } from "next/cache";

export async function getInventoryLocations(): Promise<{ id: string; name: string }[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.inventoryLocation.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.category.findMany({
    where: {
      organizationId: context.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getSuppliers(): Promise<{ id: string; name: string }[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.supplier.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getInventoryProducts(params: {
  search?: string;
  locationId?: string;
  categoryId?: string;
  supplierId?: string;
  stockLevel?: "low" | "out" | "normal" | "all";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<InventoryProduct[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  const { search, locationId, categoryId, supplierId, stockLevel, sortBy, sortOrder = "asc" } = params;

  // Build the where clause
  const where: any = {
    organizationId: context.organizationId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      {
        variants: {
          some: {
            sku: { contains: search, mode: 'insensitive' }
          }
        }
      }
    ];
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  if (supplierId && supplierId !== "all") {
    where.suppliers = {
      some: {
        supplierId: supplierId,
      },
    };
  }

  const products = await db.product.findMany({
    where,
    include: {
      category: true,
      suppliers: {
        include: {
          supplier: true,
        },
      },
      variants: {
        include: {
          variantStocks: {
            where: locationId && locationId !== "all" ? { locationId } : undefined,
          },
        },
      },
    },
  });

  // Flatten and filter by stock level if needed
  let results = products.flatMap((product) =>
    product.variants.map((variant) => {
      const stocks = variant.variantStocks;
      const currentStock = stocks.reduce((acc, s) => acc.plus(s.currentStock), new Decimal(0));
      const lowStockThreshold = variant.reorderPoint || product.lowStockThreshold || 0;

      let status: "High" | "Low" | "Out of Stock" | "Normal" = "Normal";
      if (currentStock.isZero()) {
        status = "Out of Stock";
      } else if (currentStock.lessThanOrEqualTo(lowStockThreshold)) {
        status = "Low";
      } else if (currentStock.greaterThan(lowStockThreshold * 2)) {
        status = "High";
      }

      return {
        id: product.id,
        variantId: variant.id,
        name: product.name,
        sku: variant.sku || product.sku,
        category: product.category.name,
        supplier: product.suppliers[0]?.supplier.name || "N/A",
        currentStock: currentStock.toNumber(),
        status,
        unitPrice: variant.retailPrice?.toNumber() || variant.buyingPrice.toNumber(),
        image: product.imageUrls[0],
      };
    })
  );

  if (stockLevel && stockLevel !== "all") {
    results = results.filter((r) => {
      if (stockLevel === "low") return r.status === "Low";
      if (stockLevel === "out") return r.status === "Out of Stock";
      if (stockLevel === "normal") return r.status === "Normal" || r.status === "High";
      return true;
    });
  }

  // Sorting
  if (sortBy) {
    results.sort((a, b) => {
      let valA: any = a[sortBy as keyof typeof a];
      let valB: any = b[sortBy as keyof typeof b];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  return results;
}

export async function getVariantStockByLocation(variantId: string, locationId: string): Promise<number> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return 0;

  const stock = await db.productVariantStock.findUnique({
    where: {
      variantId_locationId: {
        variantId,
        locationId,
      },
    },
    select: {
      currentStock: true,
    },
  });

  return stock?.currentStock.toNumber() || 0;
}

export async function adjustStock(data: {
  variantId: string;
  locationId: string;
  quantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
}): Promise<StockAdjustment | null> {
  const context = await getOrganizationContext();
  if (!context?.organizationId || !context.user.id) {
    throw new Error("Unauthorized");
  }

  const { variantId, locationId, quantity, reason, notes } = data;

  if (isNaN(quantity) || quantity === 0) return null;

  // Start a transaction
  return db.$transaction(async (tx) => {
    // 1. Create Stock Adjustment
    const adjustment = await tx.stockAdjustment.create({
      data: {
        variantId,
        locationId,
        memberId: context.user.id,
        quantity: new Decimal(quantity),
        reason,
        notes,
        status: AdjustmentStatus.APPROVED,
        organizationId: context.organizationId,
      },
    });

    // 2. Create Stock Movement
    await tx.stockMovement.create({
      data: {
        variantId,
        quantity: new Decimal(quantity),
        toLocationId: quantity > 0 ? locationId : null,
        fromLocationId: quantity < 0 ? locationId : null,
        movementType: quantity > 0 ? MovementType.ADJUSTMENT_IN : MovementType.ADJUSTMENT_OUT,
        adjustmentId: adjustment.id,
        memberId: context.user.id,
        notes,
        organizationId: context.organizationId,
      },
    });

    // 3. Update ProductVariantStock
    const stock = await tx.productVariantStock.findUnique({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
    });

    if (stock) {
      await tx.productVariantStock.update({
        where: { id: stock.id },
        data: {
          currentStock: { increment: new Decimal(quantity) },
          availableStock: { increment: new Decimal(quantity) },
        },
      });
    } else {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { productId: true }
      });

      if (!variant) throw new Error("Variant not found");

      await tx.productVariantStock.create({
        data: {
          variantId,
          locationId,
          productId: variant.productId,
          currentStock: new Decimal(quantity),
          availableStock: new Decimal(quantity),
          organizationId: context.organizationId,
        },
      });
    }

    revalidatePath("/inventory");
    return adjustment;
  });
}

export async function updateValue(data: {
  variantId: string;
  retailPrice?: number;
  buyingPrice?: number;
}): Promise<ProductVariant> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const { variantId, retailPrice, buyingPrice } = data;

  const result = await db.productVariant.update({
    where: { id: variantId },
    data: {
      retailPrice: retailPrice !== undefined ? new Decimal(retailPrice) : undefined,
      buyingPrice: buyingPrice !== undefined ? new Decimal(buyingPrice) : undefined,
    },
  });

  revalidatePath("/inventory");
  return result;
}

export async function updateStockAlert(data: {
  variantId: string;
  reorderPoint: number;
}): Promise<ProductVariant> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.productVariant.update({
    where: { id: data.variantId },
    data: {
      reorderPoint: new Decimal(data.reorderPoint).toNumber(), // Schema says Int but I used Decimal in my head, let me check. Actually it is Int @default(5) in ProductVariant
    },
  });

  revalidatePath("/inventory");
  return result;
}

export async function reorderProduct(variantId: string): Promise<{ success: boolean; message: string }> {
  const context = await getOrganizationContext();
  if (!context?.organizationId || !context.user.id) {
    throw new Error("Unauthorized");
  }

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      suppliers: {
        include: { supplier: true },
        take: 1
      }
    }
  });

  if (!variant) throw new Error("Variant not found");

  const supplier = variant.suppliers[0]?.supplier;
  if (!supplier) {
    throw new Error("No supplier associated with this product. Please assign a supplier before reordering.");
  }

  // Create a Purchase Order in ORDERED status
  const purchase = await db.purchase.create({
    data: {
      organizationId: context.organizationId,
      supplierId: supplier.id,
      memberId: context.user.id,
      status: "ORDERED",
      orderDate: new Date(),
      totalAmount: variant.buyingPrice.mul(variant.reorderQty || 10),
      purchaseNumber: `PO-${Date.now()}`,
      items: {
        create: {
          variantId: variant.id,
          orderedQuantity: Number(variant.reorderQty || 10),
          unitCost: variant.buyingPrice,
          totalCost: variant.buyingPrice.mul(variant.reorderQty || 10),
        }
      }
    }
  });

  revalidatePath("/inventory");

  return {
    success: true,
    message: `Purchase Order ${purchase.purchaseNumber} for ${variant.product.name} has been created.`
  };
}

export type InventoryProduct = {
  id: string;
  variantId: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  currentStock: number;
  status: "High" | "Low" | "Out of Stock" | "Normal";
  unitPrice: number;
  image?: string;
};

export async function getStockAdjustmentHistory(variantId: string): Promise<(StockAdjustment & { member: { user: { name: string | null; image: string | null } } })[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.stockAdjustment.findMany({
    where: {
      variantId,
      organizationId: context.organizationId,
    },
    include: {
      member: {
        select: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      adjustmentDate: 'desc',
    },
    take: 10,
  });
}
