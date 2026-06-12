"use server";

import {
  db,
  StockAdjustmentReason,
  MovementType,
  AdjustmentStatus,
  Decimal,
  StockAdjustment,
  ProductVariant,
  Prisma,
} from "@repo/db";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";

export async function getInventoryLocations(): Promise<
  { id: string; name: string; isDefault: boolean }[]
> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.inventoryLocation.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      isDefault: true,
    },
  });
}

export async function getCategoriesFull(): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.category.findMany({
    where: {
      organizationId: context.organizationId,
      parentId: null, // Only fetch top-level categories
    },
    include: {
      subcategories: {
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const category = await db.category.create({
    data: {
      ...data,
      organizationId: context.organizationId,
      code: `${context.organizationId}-${data.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    },
  });

  revalidatePath("/inventory/categories");
  revalidatePath("/inventory");
  return category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    parentId?: string;
    color?: string;
  },
): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const category = await db.category.update({
    where: { id, organizationId: context.organizationId },
    data,
  });

  revalidatePath("/inventory/categories");
  revalidatePath("/inventory");
  return category;
}

export async function deleteCategory(id: string): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const productsCount = await db.product.count({
    where: { categoryId: id },
  });

  if (productsCount > 0) {
    throw new Error(
      "Cannot delete category with associated products. Please move or delete the products first.",
    );
  }

  await db.category.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory/categories");
  revalidatePath("/inventory");
}

export async function createProduct(data: {
  name: string;
  sku: string;
  slug?: string;
  categoryId: string;
  buyingPrice: number;
  retailPrice: number;
  initialStock: number;
  imageUrls: string[];
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  return db.$transaction(async (tx) => {
    // 1. Create the Product
    const product = await tx.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        slug: data.slug,
        categoryId: data.categoryId,
        organizationId: context.organizationId,
        imageUrls: data.imageUrls,
        type: "FINISHED_GOOD",
      },
    });

    // 2. Create the Default Variant
    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        name: "Default",
        sku: data.sku,
        buyingPrice: new Decimal(data.buyingPrice),
        retailPrice: new Decimal(data.retailPrice),
        attributes: {}, // Required by schema
      },
    });

    // Find default location
    const defaultLocation =
      (await tx.inventoryLocation.findFirst({
        where: { organizationId: context.organizationId, isDefault: true },
      })) ||
      (await tx.inventoryLocation.findFirst({
        where: { organizationId: context.organizationId },
      }));

    if (!defaultLocation)
      throw new Error(
        "No inventory location found. Please create a location first.",
      );

    if (data.initialStock > 0) {
      // 3. Create ProductVariantStock
      await tx.productVariantStock.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          locationId: defaultLocation.id,
          currentStock: new Decimal(data.initialStock),
          availableStock: new Decimal(data.initialStock),
          organizationId: context.organizationId,
        },
      });

      // 4. Create Stock Batch for the enterprise logic
      const batch = await tx.stockBatch.create({
        data: {
          organizationId: context.organizationId,
          variantId: variant.id,
          locationId: defaultLocation.id,
          initialQuantity: new Decimal(data.initialStock),
          currentQuantity: new Decimal(data.initialStock),
          purchasePrice: new Decimal(data.buyingPrice),
          receivedDate: new Date(),
          batchNumber: `INIT-${variant.sku}-${Date.now().toString().slice(-4)}`,
        },
      });

      // 5. Create Stock Adjustment for history
      const adjustment = await tx.stockAdjustment.create({
        data: {
          variantId: variant.id,
          locationId: defaultLocation.id,
          memberId: context.memberId,
          quantity: new Decimal(data.initialStock),
          reason: "INITIAL_STOCK",
          notes: "Initial stock upon product creation",
          status: "APPROVED",
          organizationId: context.organizationId,
          stockBatchId: batch.id,
        },
      });

      // 6. Create Stock Movement
      await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          quantity: new Decimal(data.initialStock),
          toLocationId: defaultLocation.id,
          movementType: "INITIAL_STOCK",
          adjustmentId: adjustment.id,
          memberId: context.memberId,
          notes: "Initial stock upon product creation",
          organizationId: context.organizationId,
          stockBatchId: batch.id,
        },
      });
    } else {
      await tx.productVariantStock.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          locationId: defaultLocation.id,
          currentStock: new Decimal(0),
          availableStock: new Decimal(0),
          organizationId: context.organizationId,
        },
      });
    }

    revalidatePath("/inventory");
    return product;
  });
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    slug?: string;
    categoryId?: string;
    description?: string;
    detailedDescription?: string;
    buyingPrice?: number;
    retailPrice?: number;
    imageUrls?: string[];
    tags?: string[];
  },
): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  return db.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id, organizationId: context.organizationId },
      data: {
        name: data.name,
        sku: data.sku,
        slug: data.slug,
        categoryId: data.categoryId,
        description: data.description,
        detailedDescription: data.detailedDescription,
        imageUrls: data.imageUrls,
        tags: data.tags,
      },
    });

    const variant = await tx.productVariant.findFirst({
      where: { productId: id },
    });

    if (variant) {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          sku: data.sku,
          buyingPrice:
            data.buyingPrice !== undefined
              ? new Decimal(data.buyingPrice)
              : undefined,
          retailPrice:
            data.retailPrice !== undefined
              ? new Decimal(data.retailPrice)
              : undefined,
        },
      });
    }

    revalidatePath("/inventory");
    return product;
  });
}

export async function deleteProduct(id: string): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  await db.product.delete({
    where: { id, organizationId: context.organizationId },
  });

  revalidatePath("/inventory");
}

export async function checkProductUniqueness(params: {
  sku?: string;
  slug?: string;
  excludeId?: string;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) return { sku: true, slug: true };

  const { sku, slug, excludeId } = params;
  const results = { sku: true, slug: true };

  if (sku) {
    const existing = await db.product.findFirst({
      where: {
        sku,
        organizationId: context.organizationId,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    results.sku = !existing;
  }

  if (slug) {
    const existing = await db.product.findFirst({
      where: {
        slug,
        organizationId: context.organizationId,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    results.slug = !existing;
  }

  return results;
}

export async function getProduct(id: string): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  return db.product.findUnique({
    where: { id, organizationId: context.organizationId },
    include: {
      category: true,
      variants: {
        include: {
          variantStocks: true,
          priceListItems: true,
          pricingRules: true,
        },
      },
      suppliers: {
        include: {
          supplier: true,
        },
      },
    },
  });
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  const context = await getServerAuth();
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
  const context = await getServerAuth();
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
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const {
    search,
    locationId,
    categoryId,
    supplierId,
    stockLevel,
    sortBy,
    sortOrder = "asc",
  } = params;

  // Build the where clause
  const where: any = {
    organizationId: context.organizationId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      {
        variants: {
          some: {
            sku: { contains: search, mode: "insensitive" },
          },
        },
      },
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
            where:
              locationId && locationId !== "all" ? { locationId } : undefined,
          },
        },
      },
    },
  });

  // Flatten and filter by stock level if needed
  let results = products.flatMap((product) =>
    product.variants.map((variant) => {
      const stocks = variant.variantStocks;
      const currentStock = stocks.reduce(
        (acc, s) => acc.plus(s.currentStock),
        new Decimal(0),
      );
      const lowStockThreshold =
        variant.reorderPoint || product.lowStockThreshold || 0;

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
        unitPrice: Number(variant.retailPrice) || Number(variant.buyingPrice),
        image: product.imageUrls[0],
      };
    }),
  );

  if (stockLevel && stockLevel !== "all") {
    results = results.filter((r) => {
      if (stockLevel === "low") return r.status === "Low";
      if (stockLevel === "out") return r.status === "Out of Stock";
      if (stockLevel === "normal")
        return r.status === "Normal" || r.status === "High";
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

export async function getVariantStockByLocation(
  variantId: string,
  locationId: string,
): Promise<number> {
  const context = await getServerAuth();
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
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId) {
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
        memberId: context.memberId,
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
        movementType:
          quantity > 0
            ? MovementType.ADJUSTMENT_IN
            : MovementType.ADJUSTMENT_OUT,
        adjustmentId: adjustment.id,
        memberId: context.memberId,
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

    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true, buyingPrice: true, sku: true },
    });

    if (!variant) throw new Error("Variant not found");

    let batchId: string | undefined;

    // Create a batch if adding stock
    if (quantity > 0) {
      const batch = await tx.stockBatch.create({
        data: {
          organizationId: context.organizationId,
          variantId,
          locationId,
          initialQuantity: new Decimal(quantity),
          currentQuantity: new Decimal(quantity),
          purchasePrice: variant.buyingPrice,
          receivedDate: new Date(),
          batchNumber: `ADJ-${variant.sku}-${Date.now().toString().slice(-4)}`,
        },
      });
      batchId = batch.id;
    }

    if (stock) {
      await tx.productVariantStock.update({
        where: { id: stock.id },
        data: {
          currentStock: { increment: new Decimal(quantity) },
          availableStock: { increment: new Decimal(quantity) },
        },
      });
    } else {
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

    // Update adjustment and movement with batchId if it was created
    if (batchId) {
      await tx.stockAdjustment.update({
        where: { id: adjustment.id },
        data: { stockBatchId: batchId },
      });

      await tx.stockMovement.update({
        where: { adjustmentId: adjustment.id },
        data: { stockBatchId: batchId },
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
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const { variantId, retailPrice, buyingPrice } = data;

  const result = await db.productVariant.update({
    where: { id: variantId },
    data: {
      retailPrice:
        retailPrice !== undefined ? new Decimal(retailPrice) : undefined,
      buyingPrice:
        buyingPrice !== undefined ? new Decimal(buyingPrice) : undefined,
    },
  });

  revalidatePath("/inventory");
  return result;
}

export async function updateStockAlert(data: {
  variantId: string;
  reorderPoint: number;
}): Promise<ProductVariant> {
  const context = await getServerAuth();
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

export async function reorderProduct(
  variantId: string,
): Promise<{ success: boolean; message: string }> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId) {
    throw new Error("Unauthorized");
  }

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      suppliers: {
        include: { supplier: true },
        take: 1,
      },
    },
  });

  if (!variant) throw new Error("Variant not found");

  const supplier = variant.suppliers[0]?.supplier;
  if (!supplier) {
    throw new Error(
      "No supplier associated with this product. Please assign a supplier before reordering.",
    );
  }

  // Create a Purchase Order in ORDERED status
  const purchase = await db.purchase.create({
    data: {
      organizationId: context.organizationId,
      supplierId: supplier.id,
      memberId: context.memberId,
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
        },
      },
    },
  });

  revalidatePath("/inventory");

  return {
    success: true,
    message: `Purchase Order ${purchase.purchaseNumber} for ${variant.product.name} has been created.`,
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

export async function bulkDeleteVariants(variantIds: string[]): Promise<Prisma.BatchPayload> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.productVariant.deleteMany({
    where: {
      id: { in: variantIds },
      product: { organizationId: context.organizationId },
    },
  });

  revalidatePath("/inventory");
  return result;
}

export async function updateVariantStatus(variantIds: string[], isActive: boolean): Promise<Prisma.BatchPayload> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const result = await db.productVariant.updateMany({
    where: {
      id: { in: variantIds },
      product: { organizationId: context.organizationId },
    },
    data: { isActive },
  });

  revalidatePath("/inventory");
  return result;
}

export async function getStockAdjustmentHistory(variantId: string): Promise<
  (StockAdjustment & {
    member: { user: { name: string | null; image: string | null } };
  })[]
> {
  const context = await getServerAuth();
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
      adjustmentDate: "desc",
    },
    take: 10,
  });
}
