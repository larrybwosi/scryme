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
  SystemUnit,
  OrganizationUnit,
  ReorderRule,
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

  return db.$transaction(async tx => {
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
    type?: any;
    brand?: string;
    rating?: number;
    isNew?: boolean;
    isFeatured?: boolean;
    lowStockThreshold?: number;
    isActive?: boolean;
  },
): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  return db.$transaction(async tx => {
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
        type: data.type,
        brand: data.brand,
        rating: data.rating,
        isNew: data.isNew,
        isFeatured: data.isFeatured,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
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
    } else if (
      data.buyingPrice !== undefined ||
      data.retailPrice !== undefined
    ) {
      // If variant doesn't exist but pricing was provided, we might be in an inconsistent state
      // but let's try to update the first variant anyway if possible.
      const firstVariant = await tx.productVariant.findFirst({
        where: { productId: id },
      });
      if (firstVariant) {
        await tx.productVariant.update({
          where: { id: firstVariant.id },
          data: {
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
          baseUnit: true,
          baseOrgUnit: true,
          stockingUnit: true,
          stockingOrgUnit: true,
          sellingUnits: {
            include: {
              systemUnit: true,
              orgUnit: true,
            },
          },
          reorderRules: {
            include: {
              location: true,
              preferredSupplier: true,
            },
          },
        },
      },
      suppliers: {
        include: {
          supplier: true,
        },
      },
      reorderRules: {
        include: {
          location: true,
          preferredSupplier: true,
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

export async function getSystemUnits(): Promise<SystemUnit[]> {
  return db.systemUnit.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getOrganizationUnits(): Promise<OrganizationUnit[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.organizationUnit.findMany({
    where: {
      organizationId: context.organizationId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function updateVariantUnits(
  variantId: string,
  data: {
    baseUnitId?: string | null;
    baseOrgUnitId?: string | null;
    stockingUnitId?: string | null;
    stockingOrgUnitId?: string | null;
    sellingUnits: Array<{
      id?: string;
      systemUnitId?: string | null;
      orgUnitId?: string | null;
      retailPrice?: number;
      wholesalePrice?: number;
      conversionMultiplier: number;
      isActive: boolean;
    }>;
  },
): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  return db.$transaction(async tx => {
    // 1. Update Variant primary units
    const variant = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        baseUnitId: data.baseUnitId,
        baseOrgUnitId: data.baseOrgUnitId,
        stockingUnitId: data.stockingUnitId,
        stockingOrgUnitId: data.stockingOrgUnitId,
      },
    });

    // 2. Manage Selling Units
    // Delete units not in the list
    const incomingIds = data.sellingUnits
      .map(su => su.id)
      .filter(Boolean) as string[];
    await tx.variantSellingUnit.deleteMany({
      where: {
        variantId,
        id: { notIn: incomingIds },
      },
    });

    // Handle updates and creations
    for (const su of data.sellingUnits) {
      if (su.id) {
        await tx.variantSellingUnit.update({
          where: { id: su.id },
          data: {
            systemUnitId: su.systemUnitId,
            orgUnitId: su.orgUnitId,
            retailPrice: su.retailPrice ? new Decimal(su.retailPrice) : null,
            wholesalePrice: su.wholesalePrice
              ? new Decimal(su.wholesalePrice)
              : null,
            conversionMultiplier: new Decimal(su.conversionMultiplier),
            isActive: su.isActive,
          },
        });
      } else {
        await tx.variantSellingUnit.create({
          data: {
            variantId,
            systemUnitId: su.systemUnitId,
            orgUnitId: su.orgUnitId,
            retailPrice: su.retailPrice ? new Decimal(su.retailPrice) : null,
            wholesalePrice: su.wholesalePrice
              ? new Decimal(su.wholesalePrice)
              : null,
            conversionMultiplier: new Decimal(su.conversionMultiplier),
            isActive: su.isActive,
          },
        });
      }
    }

    revalidatePath(`/inventory/products/${variant.productId}`);
    return variant;
  });
}

export async function getReorderRules(
  productId: string,
): Promise<ReorderRule[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.reorderRule.findMany({
    where: {
      productId,
      organizationId: context.organizationId,
    },
    include: {
      location: true,
      preferredSupplier: true,
    },
  });
}

export async function updateReorderRule(data: {
  id?: string;
  productId: string;
  variantId?: string | null;
  locationId: string;
  minQuantity: number;
  maxQuantity: number;
  reorderQuantity: number;
  isActive: boolean;
  autoGenerate: boolean;
  preferredSupplierId?: string | null;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const ruleData = {
    organizationId: context.organizationId,
    productId: data.productId,
    variantId: data.variantId,
    locationId: data.locationId,
    minQuantity: new Decimal(data.minQuantity),
    maxQuantity: new Decimal(data.maxQuantity),
    reorderQuantity: new Decimal(data.reorderQuantity),
    isActive: data.isActive,
    autoGenerate: data.autoGenerate,
    preferredSupplierId: data.preferredSupplierId,
  };

  let rule;
  if (data.id) {
    rule = await db.reorderRule.update({
      where: { id: data.id },
      data: ruleData,
    });
  } else {
    rule = await db.reorderRule.create({
      data: ruleData,
    });
  }

  revalidatePath(`/inventory/products/${data.productId}`);
  return rule;
}

export async function generateProductSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  groupByProduct?: boolean;
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
    groupByProduct = false,
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

  let results: InventoryProduct[] = [];

  if (groupByProduct) {
    // Map to products and calculate aggregated values
    results = products.map(product => {
      const allVariantStocks = product.variants.flatMap(v => v.variantStocks);
      const totalStock = allVariantStocks.reduce(
        (acc, s) => acc.plus(s.currentStock),
        new Decimal(0),
      );

      const prices = product.variants.map(
        v => Number(v.retailPrice) || Number(v.buyingPrice),
      );
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      const lowStockThreshold = product.lowStockThreshold || 0;

      let status: "High" | "Low" | "Out of Stock" | "Normal" = "Normal";
      if (totalStock.isZero()) {
        status = "Out of Stock";
      } else if (totalStock.lessThanOrEqualTo(lowStockThreshold)) {
        status = "Low";
      } else if (totalStock.greaterThan(lowStockThreshold * 2)) {
        status = "High";
      }

      return {
        id: product.id,
        variantId: product.variants[0]?.id || "", // Fallback to first variant for actions
        name: product.name,
        sku: product.sku, // Base SKU of the product
        category: product.category.name,
        supplier: product.suppliers[0]?.supplier.name || "N/A",
        currentStock: totalStock.toNumber(),
        status,
        unitPrice: minPrice,
        minPrice,
        maxPrice,
        image: product.imageUrls[0],
      };
    });
  } else {
    // Flatten and filter by stock level if needed
    results = products.flatMap(product =>
      product.variants.map(variant => {
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
          variantName: variant.name,
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
  }

  if (stockLevel && stockLevel !== "all") {
    results = results.filter(r => {
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
  return db.$transaction(async tx => {
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

export async function createVariant(data: {
  productId: string;
  name: string;
  sku: string;
  buyingPrice: number;
  retailPrice: number;
  initialStock?: number;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  return db.$transaction(async tx => {
    const variant = await tx.productVariant.create({
      data: {
        productId: data.productId,
        name: data.name,
        sku: data.sku,
        buyingPrice: new Decimal(data.buyingPrice),
        retailPrice: new Decimal(data.retailPrice),
        attributes: {},
      },
    });

    const defaultLocation =
      (await tx.inventoryLocation.findFirst({
        where: { organizationId: context.organizationId, isDefault: true },
      })) ||
      (await tx.inventoryLocation.findFirst({
        where: { organizationId: context.organizationId },
      }));

    if (defaultLocation) {
      const stockAmount = data.initialStock || 0;
      await tx.productVariantStock.create({
        data: {
          productId: data.productId,
          variantId: variant.id,
          locationId: defaultLocation.id,
          currentStock: new Decimal(stockAmount),
          availableStock: new Decimal(stockAmount),
          organizationId: context.organizationId,
        },
      });
    }

    revalidatePath(`/inventory/products/${data.productId}`);
    return variant;
  });
}

export async function updateVariant(
  id: string,
  data: {
    name?: string;
    sku?: string;
    barcode?: string;
    buyingPrice?: number;
    retailPrice?: number;
    attributes?: any;
    isActive?: boolean;
    reorderPoint?: number;
    reorderQty?: number;
    pointsOnPurchase?: number;
    loyaltyPointsOverride?: number;
    defaultShelfLifeDays?: number;
    requiresExpiryTracking?: boolean;
    expiryWarningDays?: number;
    requiresSerialNumber?: boolean;
    tags?: string[];
  },
): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const variant = await db.productVariant.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      buyingPrice:
        data.buyingPrice !== undefined
          ? new Decimal(data.buyingPrice)
          : undefined,
      retailPrice:
        data.retailPrice !== undefined
          ? new Decimal(data.retailPrice)
          : undefined,
      attributes: data.attributes,
      isActive: data.isActive,
      reorderPoint: data.reorderPoint,
      reorderQty: data.reorderQty,
      pointsOnPurchase: data.pointsOnPurchase,
      loyaltyPointsOverride: data.loyaltyPointsOverride,
      defaultShelfLifeDays: data.defaultShelfLifeDays,
      requiresExpiryTracking: data.requiresExpiryTracking,
      expiryWarningDays: data.expiryWarningDays,
      requiresSerialNumber: data.requiresSerialNumber,
      tags: data.tags,
    },
  });

  revalidatePath(`/inventory/products/${variant.productId}`);
  return variant;
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
  minPrice?: number;
  maxPrice?: number;
  image?: string;
  variantName?: string;
};

export async function bulkDeleteVariants(
  variantIds: string[],
): Promise<Prisma.BatchPayload> {
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

export async function updateVariantStatus(
  variantIds: string[],
  isActive: boolean,
): Promise<Prisma.BatchPayload> {
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

export type ProductImportData = {
  name: string;
  sku: string;
  categoryName: string;
  buyingPrice: number;
  retailPrice: number;
  initialStock?: number;
  description?: string;
  barcode?: string;
};

export async function importProducts(
  products: ProductImportData[],
  strategy: "skip" | "replace",
): Promise<{
  success: number;
  skipped: number;
  replaced: number;
  failed: number;
  errors: string[];
}> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const results = {
    success: 0,
    skipped: 0,
    replaced: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Pre-fetch all categories for the organization to optimize lookups
  const existingCategories = await db.category.findMany({
    where: { organizationId: context.organizationId },
  });

  const categoryMap = new Map(
    existingCategories.map(c => [c.name.toLowerCase(), c.id]),
  );

  for (const productData of products) {
    try {
      await db.$transaction(async tx => {
        // 1. Handle SKU Autogeneration
        let sku = productData.sku;
        if (!sku || sku.trim() === "") {
          const prefix = (productData.name || "PRD")
            .substring(0, 3)
            .toUpperCase()
            .padEnd(3, "X");
          const random = Math.floor(10000 + Math.random() * 90000);
          sku = `${prefix}-${random}`;
        }

        // 2. Handle Category
        const categoryName =
          !productData.categoryName || productData.categoryName.trim() === ""
            ? "Uncategorized"
            : productData.categoryName;

        let categoryId = categoryMap.get(categoryName.toLowerCase());
        if (!categoryId) {
          const newCategory = await tx.category.create({
            data: {
              name: categoryName,
              organizationId: context.organizationId,
              code: `${context.organizationId}-${categoryName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            },
          });
          categoryId = newCategory.id;
          categoryMap.set(categoryName.toLowerCase(), categoryId);
        }

        // 3. Check for existing product/variant by SKU
        const existingVariant = await tx.productVariant.findFirst({
          where: {
            sku: sku,
            product: { organizationId: context.organizationId },
          },
          include: { product: true },
        });

        if (existingVariant) {
          if (strategy === "skip") {
            results.skipped++;
            return;
          } else {
            // Replace/Update strategy
            await tx.product.update({
              where: { id: existingVariant.productId },
              data: {
                name: productData.name,
                description: productData.description,
                categoryId: categoryId,
              },
            });

            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                buyingPrice: new Decimal(productData.buyingPrice),
                retailPrice: new Decimal(productData.retailPrice),
                barcode: productData.barcode,
              },
            });

            results.replaced++;
            return;
          }
        }

        // 4. Create New Product
        const product = await tx.product.create({
          data: {
            name: productData.name,
            sku: sku,
            slug: await generateProductSlug(productData.name + "-" + sku),
            description: productData.description,
            categoryId: categoryId,
            organizationId: context.organizationId,
            type: "FINISHED_GOOD",
            barcode: productData.barcode,
          },
        });

        // 5. Create Default Variant
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            name: "Default",
            sku: sku,
            barcode: productData.barcode,
            buyingPrice: new Decimal(productData.buyingPrice),
            retailPrice: new Decimal(productData.retailPrice),
            attributes: {},
          },
        });

        // 5. Handle Initial Stock
        if (productData.initialStock && productData.initialStock > 0) {
          const defaultLocation =
            (await tx.inventoryLocation.findFirst({
              where: {
                organizationId: context.organizationId,
                isDefault: true,
              },
            })) ||
            (await tx.inventoryLocation.findFirst({
              where: { organizationId: context.organizationId },
            }));

          if (defaultLocation) {
            await tx.productVariantStock.create({
              data: {
                productId: product.id,
                variantId: variant.id,
                locationId: defaultLocation.id,
                currentStock: new Decimal(productData.initialStock),
                availableStock: new Decimal(productData.initialStock),
                organizationId: context.organizationId,
              },
            });

            const batch = await tx.stockBatch.create({
              data: {
                organizationId: context.organizationId,
                variantId: variant.id,
                locationId: defaultLocation.id,
                initialQuantity: new Decimal(productData.initialStock),
                currentQuantity: new Decimal(productData.initialStock),
                purchasePrice: new Decimal(productData.buyingPrice),
                receivedDate: new Date(),
                batchNumber: `IMPORT-${variant.sku}-${Date.now().toString().slice(-4)}`,
              },
            });

            const adjustment = await tx.stockAdjustment.create({
              data: {
                variantId: variant.id,
                locationId: defaultLocation.id,
                memberId: context.memberId,
                quantity: new Decimal(productData.initialStock),
                reason: "INITIAL_STOCK",
                notes: "Initial stock from CSV import",
                status: "APPROVED",
                organizationId: context.organizationId,
                stockBatchId: batch.id,
              },
            });

            await tx.stockMovement.create({
              data: {
                variantId: variant.id,
                quantity: new Decimal(productData.initialStock),
                toLocationId: defaultLocation.id,
                movementType: "INITIAL_STOCK",
                adjustmentId: adjustment.id,
                memberId: context.memberId,
                notes: "Initial stock from CSV import",
                organizationId: context.organizationId,
                stockBatchId: batch.id,
              },
            });
          }
        } else {
          // Create empty stock record for default location if possible
          const defaultLocation = await tx.inventoryLocation.findFirst({
            where: { organizationId: context.organizationId },
          });
          if (defaultLocation) {
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
        }

        results.success++;
      });
    } catch (error: any) {
      results.failed++;
      results.errors.push(
        `Failed to import ${productData.name}: ${error.message}`,
      );
    }
  }

  revalidatePath("/inventory");
  return results;
}
