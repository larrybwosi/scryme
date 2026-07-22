"use server";

import {
  db,
  StockTransferStatus,
  MovementType,
  AlertStatus,
  StockRequestStatus,
  StockRequestPriority,
} from "@repo/db";
import { revalidatePath } from "next/cache";
import {
  startOfMonth,
  subMonths,
  format,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import Decimal from "decimal.js";
import { getServerAuth } from "@repo/auth/server";

export async function bulkUpdateLocationStock(
  locationId: string,
  updates: { variantId: string; newTotalStock: number }[],
): Promise<{ success: boolean; message: string }> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId) {
    throw new Error("Unauthorized");
  }

  if (updates.length === 0) {
    return { success: true, message: "No updates provided." };
  }

  await db.$transaction(async tx => {
    for (const update of updates) {
      const { variantId, newTotalStock } = update;

      // 1. Get current stock
      const stockRecord = await tx.productVariantStock.findUnique({
        where: {
          variantId_locationId: {
            variantId,
            locationId,
          },
        },
      });

      const currentStock = stockRecord?.currentStock || new Decimal(0);
      const diff = new Decimal(newTotalStock).minus(currentStock);

      if (diff.isZero()) continue;

      // 2. Create Stock Adjustment
      const adjustment = await tx.stockAdjustment.create({
        data: {
          variantId,
          locationId,
          memberId: context.memberId!,
          quantity: diff,
          reason: "INVENTORY_COUNT",
          notes: "Bulk update from location stock table",
          status: "APPROVED",
          organizationId: context.organizationId,
        },
      });

      // 3. Create Stock Movement
      await tx.stockMovement.create({
        data: {
          organizationId: context.organizationId,
          variantId,
          quantity: diff,
          fromLocationId: diff.isNegative() ? locationId : null,
          toLocationId: diff.isPositive() ? locationId : null,
          movementType: diff.isPositive() ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          adjustmentId: adjustment.id,
          memberId: context.memberId!,
          notes: "Bulk update from location stock table",
        },
      });

      // 4. Update or Create ProductVariantStock
      if (stockRecord) {
        await tx.productVariantStock.update({
          where: { id: stockRecord.id },
          data: {
            currentStock: new Decimal(newTotalStock),
            availableStock: { increment: diff }, // Assuming available follows current
          },
        });
      } else {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { productId: true },
        });

        if (!variant) throw new Error(`Variant ${variantId} not found`);

        await tx.productVariantStock.create({
          data: {
            organizationId: context.organizationId,
            productId: variant.productId,
            variantId,
            locationId,
            currentStock: new Decimal(newTotalStock),
            availableStock: new Decimal(newTotalStock),
          },
        });
      }

      // 5. Handle Batch if adding stock
      if (diff.isPositive()) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { buyingPrice: true, sku: true },
        });

        const batch = await tx.stockBatch.create({
          data: {
            organizationId: context.organizationId,
            variantId,
            locationId,
            initialQuantity: diff,
            currentQuantity: diff,
            purchasePrice: variant?.buyingPrice || new Decimal(0),
            receivedDate: new Date(),
            batchNumber: `BULK-${variant?.sku || "VAR"}-${Date.now().toString().slice(-4)}`,
          },
        });

        await tx.stockAdjustment.update({
          where: { id: adjustment.id },
          data: { stockBatchId: batch.id },
        });

        await tx.stockMovement.update({
          where: { adjustmentId: adjustment.id },
          data: { stockBatchId: batch.id },
        });
      }
    }
  });

  revalidatePath(`/locations/${locationId}`);
  revalidatePath("/stocking/list");
  revalidatePath("/inventory");

  return { success: true, message: "Stock updated successfully." };
}

export async function getStockDashboardStats(): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  const [totalProducts, totalStockValue, pendingTransfers, lowStockAlerts] =
    await Promise.all([
      db.product.count({ where: { organizationId: context.organizationId } }),
      db.productVariantStock.aggregate({
        where: { organizationId: context.organizationId },
        _sum: { currentStock: true },
      }),
      db.stockTransfer.count({
        where: {
          organizationId: context.organizationId,
          status: { in: ["PENDING_APPROVAL", "SHIPPED", "IN_TRANSIT"] },
        },
      }),
      db.productVariantStock.count({
        where: {
          organizationId: context.organizationId,
          currentStock: { lte: 10 }, // Simplified for now as Prisma doesn't support field-to-field comparison easily
        },
      }),
    ]);

  // For total value, we ideally want currentStock * buyingPrice.
  // This aggregate only gives sum of stock. We'll do a more detailed query if needed.
  // For now, let's just get the count of items in stock as a placeholder or a simple sum.

  return {
    totalProducts,
    totalStockItems: totalStockValue._sum.currentStock?.toNumber() || 0,
    pendingTransfers,
    lowStockAlerts,
  };
}

export async function getStockMovementsChartData(): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM"),
    };
  }).reverse();

  const data = await Promise.all(
    last6Months.map(async month => {
      const movements = await db.stockMovement.groupBy({
        by: ["movementType"],
        where: {
          organizationId: context.organizationId,
          movementDate: {
            gte: month.start,
            lte: month.end,
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const inbound = movements
        .filter(m =>
          [
            "PURCHASE_RECEIPT",
            "ADJUSTMENT_IN",
            "TRANSFER",
            "CUSTOMER_RETURN",
          ].includes(m.movementType),
        )
        .reduce((acc, m) => acc + (m._sum.quantity?.toNumber() || 0), 0);

      const outbound = movements
        .filter(m =>
          ["SALE", "ADJUSTMENT_OUT", "SUPPLIER_RETURN"].includes(
            m.movementType,
          ),
        )
        .reduce(
          (acc, m) => acc + Math.abs(m._sum.quantity?.toNumber() || 0),
          0,
        );

      return {
        name: month.label,
        inbound,
        outbound,
      };
    }),
  );

  return data;
}

export async function getStockDistributionByLocation(): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const distribution = await db.productVariantStock.groupBy({
    by: ["locationId"],
    where: { organizationId: context.organizationId },
    _sum: {
      currentStock: true,
    },
  });

  const locations = await db.inventoryLocation.findMany({
    where: { id: { in: distribution.map(d => d.locationId) } },
    select: { id: true, name: true },
  });

  return distribution.map(d => ({
    name: locations.find(l => l.id === d.locationId)?.name || "Unknown",
    value: d._sum.currentStock?.toNumber() || 0,
  }));
}

export async function getStockTransferList(params?: {
  search?: string;
  status?: string;
}): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const where: any = { organizationId: context.organizationId };

  if (params?.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params?.search) {
    where.OR = [
      { transferNumber: { contains: params.search, mode: "insensitive" } },
      {
        fromLocation: {
          name: { contains: params.search, mode: "insensitive" },
        },
      },
      {
        toLocation: { name: { contains: params.search, mode: "insensitive" } },
      },
    ];
  }

  return db.stockTransfer.findMany({
    where,
    include: {
      fromLocation: { select: { name: true } },
      toLocation: { select: { name: true } },
      requestedBy: { select: { user: { select: { name: true } } } },
    },
    orderBy: { requestedDate: "desc" },
  });
}

export async function createStockTransfer(data: {
  fromLocationId: string;
  toLocationId: string;
  items: { variantId: string; quantity: number }[];
  notes?: string;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const transferNumber = `TRF-${Date.now()}`;

  const result = await db.$transaction(async tx => {
    const transfer = await tx.stockTransfer.create({
      data: {
        organizationId: context.organizationId,
        transferNumber,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        notes: data.notes,
        requestedById: context.memberId,
        status: "PENDING_APPROVAL",
        items: {
          create: await Promise.all(
            data.items.map(async item => {
              const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId },
                select: { buyingPrice: true },
              });
              return {
                variantId: item.variantId,
                requestedQuantity: new Decimal(item.quantity),
                unitCost: variant?.buyingPrice || new Decimal(0),
              };
            }),
          ),
        },
      },
    });

    return transfer;
  });

  revalidatePath("/stocking/transfers");
  return result;
}

export async function getStockTransferDetails(id: string): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  return db.stockTransfer.findUnique({
    where: { id, organizationId: context.organizationId },
    include: {
      fromLocation: true,
      toLocation: true,
      requestedBy: { include: { user: true } },
      approvedBy: { include: { user: true } },
      shippedBy: { include: { user: true } },
      receivedBy: { include: { user: true } },
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
}

export async function updateStockTransferStatus(
  id: string,
  status: StockTransferStatus,
  notes?: string,
): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const transfer = await db.stockTransfer.findUnique({
    where: { id, organizationId: context.organizationId },
    include: { items: true },
  });

  if (!transfer) throw new Error("Transfer not found");

  const result = await db.$transaction(async tx => {
    const updateData: any = { status };

    if (status === "APPROVED") {
      updateData.approvedById = context.memberId;
    } else if (status === "SHIPPED") {
      updateData.shippedById = context.memberId;
      updateData.shippedDate = new Date();

      // Deduct stock from source location
      for (const item of transfer.items) {
        await tx.productVariantStock.update({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.fromLocationId,
            },
          },
          data: {
            currentStock: { decrement: item.requestedQuantity },
            availableStock: { decrement: item.requestedQuantity },
          },
        });

        // Record movement
        await tx.stockMovement.create({
          data: {
            organizationId: context.organizationId,
            variantId: item.variantId,
            quantity: item.requestedQuantity.mul(-1),
            fromLocationId: transfer.fromLocationId,
            toLocationId: transfer.toLocationId,
            movementType: "TRANSFER",
            referenceId: transfer.id,
            referenceType: "StockTransfer",
            memberId: context.memberId,
            notes: `Transfer ${transfer.transferNumber} Shipped`,
          },
        });
      }
    } else if (status === "COMPLETED") {
      updateData.receivedById = context.memberId;
      updateData.receivedDate = new Date();
      updateData.completedDate = new Date();

      // Add stock to destination location
      for (const item of transfer.items) {
        const stock = await tx.productVariantStock.findUnique({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.toLocationId,
            },
          },
        });

        if (stock) {
          await tx.productVariantStock.update({
            where: { id: stock.id },
            data: {
              currentStock: { increment: item.requestedQuantity },
              availableStock: { increment: item.requestedQuantity },
            },
          });
        } else {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          await tx.productVariantStock.create({
            data: {
              organizationId: context.organizationId,
              productId: variant!.productId,
              variantId: item.variantId,
              locationId: transfer.toLocationId,
              currentStock: item.requestedQuantity,
              availableStock: item.requestedQuantity,
            },
          });
        }

        // Record movement
        await tx.stockMovement.create({
          data: {
            organizationId: context.organizationId,
            variantId: item.variantId,
            quantity: item.requestedQuantity,
            fromLocationId: transfer.fromLocationId,
            toLocationId: transfer.toLocationId,
            movementType: "TRANSFER",
            referenceId: transfer.id,
            referenceType: "StockTransfer",
            memberId: context.memberId,
            notes: `Transfer ${transfer.transferNumber} Completed`,
          },
        });
      }
    }

    return tx.stockTransfer.update({
      where: { id },
      data: updateData,
    });
  });

  revalidatePath(`/stocking/transfers/${id}`);
  revalidatePath("/stocking/transfers");
  return result;
}

export async function getProductStockDistribution(
  productId: string,
): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.productVariantStock.findMany({
    where: {
      productId,
      organizationId: context.organizationId,
    },
    include: {
      location: true,
      variant: true,
    },
  });
}

export async function getStockMovementHistory(params: {
  variantId?: string;
  locationId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.stockMovement.findMany({
    where: {
      organizationId: context.organizationId,
      variantId: params.variantId,
      OR: params.locationId
        ? [
            { fromLocationId: params.locationId },
            { toLocationId: params.locationId },
          ]
        : undefined,
      movementDate: {
        gte: params.startDate,
        lte: params.endDate,
      },
    },
    include: {
      variant: { include: { product: true } },
      fromLocation: true,
      toLocation: true,
      member: { include: { user: true } },
    },
    orderBy: { movementDate: "desc" },
    take: params.limit || 50,
  });
}

export async function getReorderRules(): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.reorderRule.findMany({
    where: { organizationId: context.organizationId },
    include: {
      product: true,
      variant: true,
      location: true,
    },
  });
}

export async function upsertReorderRule(data: {
  productId: string;
  variantId?: string;
  locationId: string;
  minQuantity: number;
  maxQuantity: number;
  reorderQuantity: number;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const rule = await db.reorderRule.upsert({
    where: {
      organizationId_productId_variantId_locationId: {
        organizationId: context.organizationId,
        productId: data.productId,
        variantId: data.variantId || (null as any),
        locationId: data.locationId,
      },
    },
    update: {
      minQuantity: new Decimal(data.minQuantity),
      maxQuantity: new Decimal(data.maxQuantity),
      reorderQuantity: new Decimal(data.reorderQuantity),
    },
    create: {
      organizationId: context.organizationId,
      productId: data.productId,
      variantId: data.variantId,
      locationId: data.locationId,
      minQuantity: new Decimal(data.minQuantity),
      maxQuantity: new Decimal(data.maxQuantity),
      reorderQuantity: new Decimal(data.reorderQuantity),
    },
  });

  revalidatePath("/stocking/reorder-rules");
  return rule;
}

export async function getStockLevels(params: {
  locationId?: string;
  search?: string;
  categoryId?: string;
  supplierId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  groupBy?: string;
}): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const {
    locationId,
    search,
    categoryId,
    supplierId,
    sortBy,
    sortOrder = "asc",
    groupBy,
  } = params;

  // Build the where clause for products
  const where: any = {
    organizationId: context.organizationId,
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      {
        variants: {
          some: { sku: { contains: search, mode: "insensitive" } },
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

  // 1. Get products and variants with their stock records
  const products = await db.product.findMany({
    where,
    include: {
      category: { select: { name: true } },
      suppliers: {
        include: { supplier: { select: { name: true } } },
      },
      variants: {
        where: { isActive: true },
        include: {
          variantStocks: {
            where:
              locationId && locationId !== "all" ? { locationId } : undefined,
            include: {
              location: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  // 2. Get incoming transfers (Shipped or In Transit)
  const incomingTransfers = await db.stockTransferItem.findMany({
    where: {
      stockTransfer: {
        organizationId: context.organizationId,
        toLocationId:
          locationId && locationId !== "all" ? locationId : undefined,
        status: { in: ["SHIPPED", "IN_TRANSIT"] },
      },
    },
    select: {
      variantId: true,
      requestedQuantity: true,
      shippedQuantity: true,
    },
  });

  // 3. Get incoming purchases (Ordered or Partially Received)
  const incomingPurchases = await db.purchaseItem.findMany({
    where: {
      purchase: {
        organizationId: context.organizationId,
        // locationId: locationId && locationId !== "all" ? locationId : undefined,
        status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] },
      },
    },
    select: {
      variantId: true,
      orderedQuantity: true,
      receivedQuantity: true,
    },
  });

  // 4. Create lookup maps for efficiency
  const transferMap = new Map<string, Decimal>();
  incomingTransfers.forEach(t => {
    const current = transferMap.get(t.variantId) || new Decimal(0);
    transferMap.set(
      t.variantId,
      current.add(t.shippedQuantity || t.requestedQuantity || 0),
    );
  });

  const purchaseMap = new Map<string, Decimal>();
  incomingPurchases.forEach(p => {
    const current = purchaseMap.get(p.variantId) || new Decimal(0);
    const pending = new Decimal(p.orderedQuantity).minus(p.receivedQuantity);
    if (pending.gt(0)) {
      purchaseMap.set(p.variantId, current.add(pending));
    }
  });

  // 5. Map results and aggregate data
  let results = products.flatMap(product =>
    product.variants.flatMap(variant => {
      const stocks = variant.variantStocks;

      if (groupBy === "location") {
        // Return a row for each location stock record
        return stocks.map(stock => {
          const incomingT = transferMap.get(variant.id) || new Decimal(0);
          const incomingP = purchaseMap.get(variant.id) || new Decimal(0);

          // Note: incoming stock is per variant, not per location in this simple aggregation
          // In a more complex setup, we'd filter incoming by location too
          return {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            variantName: variant.name,
            sku: variant.sku || product.sku,
            categoryName: product.category?.name || "Uncategorized",
            supplierName: product.suppliers[0]?.supplier.name || "N/A",
            locationId: stock.locationId,
            locationName: stock.location.name,
            currentStock: stock.currentStock.toNumber(),
            reservedStock: stock.reservedStock.toNumber(),
            availableStock: stock.availableStock.toNumber(),
            incomingStock: incomingT.add(incomingP).toNumber(),
            buyingPrice: variant.buyingPrice?.toNumber() ?? 0,
            retailPrice: variant.retailPrice?.toNumber() ?? 0,
          };
        });
      } else {
        const current = stocks.reduce(
          (acc, s) => acc.add(s.currentStock),
          new Decimal(0),
        );
        const reserved = stocks.reduce(
          (acc, s) => acc.add(s.reservedStock),
          new Decimal(0),
        );
        const available = stocks.reduce(
          (acc, s) => acc.add(s.availableStock),
          new Decimal(0),
        );

        const incomingT = transferMap.get(variant.id) || new Decimal(0);
        const incomingP = purchaseMap.get(variant.id) || new Decimal(0);

        return [
          {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            variantName: variant.name,
            sku: variant.sku || product.sku,
            categoryName: product.category?.name || "Uncategorized",
            supplierName: product.suppliers[0]?.supplier.name || "N/A",
            currentStock: current.toNumber(),
            reservedStock: reserved.toNumber(),
            availableStock: available.toNumber(),
            incomingStock: incomingT.add(incomingP).toNumber(),
            buyingPrice: variant.buyingPrice?.toNumber() ?? 0,
            retailPrice: variant.retailPrice?.toNumber() ?? 0,
          },
        ];
      }
    }),
  );

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

export async function getStockRequestList(params?: {
  search?: string;
  status?: string;
  locationId?: string;
}): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const where: any = { organizationId: context.organizationId };

  if (params?.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params?.locationId) {
    where.toLocationId = params.locationId;
  }

  if (params?.search) {
    where.OR = [
      { requestNumber: { contains: params.search, mode: "insensitive" } },
      {
        toLocation: { name: { contains: params.search, mode: "insensitive" } },
      },
      {
        requestedBy: {
          user: { name: { contains: params.search, mode: "insensitive" } },
        },
      },
    ];
  }

  return db.stockRequest.findMany({
    where,
    include: {
      toLocation: { select: { name: true } },
      requestedBy: { select: { user: { select: { name: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { requestDate: "desc" },
  });
}

export async function createStockRequest(data: {
  toLocationId: string;
  priority: StockRequestPriority;
  items: { variantId: string; quantity: number }[];
  justification?: string;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const requestNumber = `REQ-${Date.now()}`;

  const result = await db.$transaction(async tx => {
    let totalEstimatedCost = new Decimal(0);

    const itemsData = await Promise.all(
      data.items.map(async item => {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { buyingPrice: true },
        });
        const unitCost = variant?.buyingPrice || new Decimal(0);
        totalEstimatedCost = totalEstimatedCost.add(
          unitCost.mul(item.quantity),
        );

        return {
          variantId: item.variantId,
          requestedQuantity: new Decimal(item.quantity),
          unitCostAtRequest: unitCost,
        };
      }),
    );

    const request = await tx.stockRequest.create({
      data: {
        organizationId: context.organizationId,
        requestNumber,
        toLocationId: data.toLocationId,
        priority: data.priority,
        justification: data.justification,
        requestedById: context.memberId,
        status: "PENDING",
        totalEstimatedCost,
        items: {
          create: itemsData,
        },
      },
    });

    return request;
  });

  revalidatePath("/stocking/requests");
  return result;
}

export async function getExpiryReportData(params: {
  locationId?: string;
}): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const batches = await db.stockBatch.findMany({
    where: {
      organizationId: context.organizationId,
      locationId:
        params.locationId && params.locationId !== "all"
          ? params.locationId
          : undefined,
      currentQuantity: { gt: 0 },
      expiryDate: { not: null },
    },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
      location: true,
    },
    orderBy: { expiryDate: "asc" },
  });

  return batches.map(b => ({
    id: b.id,
    batchNumber: b.batchNumber,
    variantId: b.variantId,
    productName: b.variant.product.name,
    variantName: b.variant.name,
    sku: b.variant.sku,
    locationName: b.location.name,
    currentQuantity: b.currentQuantity.toNumber(),
    expiryDate: b.expiryDate ? b.expiryDate.toISOString() : null,
  }));
}

export async function getStockRequestDetails(id: string): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId) return null;

  return db.stockRequest.findUnique({
    where: { id, organizationId: context.organizationId },
    include: {
      toLocation: true,
      requestedBy: { include: { user: true } },
      approvedBy: { include: { user: true } },
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      transfers: {
        include: {
          fromLocation: true,
          toLocation: true,
        },
      },
      purchases: {
        include: {
          supplier: true,
        },
      },
    },
  });
}

export async function getAggregatedStockRequests(params?: {
  search?: string;
  locationId?: string;
}): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  const stockRequestFilter: any = {
    organizationId: context.organizationId,
    status: { in: ["PENDING", "APPROVED", "PARTIALLY_FULFILLED"] },
  };

  if (params?.locationId) {
    stockRequestFilter.toLocationId = params.locationId;
  }

  const itemWhere: any = {
    stockRequest: stockRequestFilter,
  };

  if (params?.search) {
    itemWhere.OR = [
      {
        variant: {
          product: { name: { contains: params.search, mode: "insensitive" } },
        },
      },
      { variant: { name: { contains: params.search, mode: "insensitive" } } },
      { variant: { sku: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  // Get all pending or partially fulfilled items
  const items = await db.stockRequestItem.findMany({
    where: itemWhere,
    include: {
      variant: {
        include: {
          product: true,
        },
      },
      stockRequest: {
        include: {
          toLocation: true,
        },
      },
    },
  });

  // Aggregate by variantId
  const aggregationMap = new Map<string, any>();

  items.forEach(item => {
    const remaining = new Decimal(item.requestedQuantity).minus(
      item.allocatedQuantity,
    );
    if (remaining.lte(0)) return;

    const existing = aggregationMap.get(item.variantId);
    if (existing) {
      existing.totalRequested = existing.totalRequested.add(
        item.requestedQuantity,
      );
      existing.totalAllocated = existing.totalAllocated.add(
        item.allocatedQuantity,
      );
      existing.totalRemaining = existing.totalRemaining.add(remaining);
      existing.requests.push({
        requestId: item.stockRequestId,
        requestNumber: item.stockRequest.requestNumber,
        locationName: item.stockRequest.toLocation.name,
        quantity: item.requestedQuantity,
        remaining: remaining,
      });
    } else {
      aggregationMap.set(item.variantId, {
        variantId: item.variantId,
        sku: item.variant.sku,
        name: item.variant.product.name,
        variantName: item.variant.name,
        totalRequested: new Decimal(item.requestedQuantity),
        totalAllocated: new Decimal(item.allocatedQuantity),
        totalRemaining: remaining,
        requests: [
          {
            requestId: item.stockRequestId,
            requestNumber: item.stockRequest.requestNumber,
            locationName: item.stockRequest.toLocation.name,
            quantity: item.requestedQuantity,
            remaining: remaining,
          },
        ],
      });
    }
  });

  return Array.from(aggregationMap.values()).map(item => ({
    ...item,
    totalRequested: item.totalRequested.toNumber(),
    totalAllocated: item.totalAllocated.toNumber(),
    totalRemaining: item.totalRemaining.toNumber(),
    requests: item.requests.map((r: any) => ({
      ...r,
      quantity: r.quantity.toNumber(),
      remaining: r.remaining.toNumber(),
    })),
  }));
}

export async function getStockRequestLocations(): Promise<any[]> {
  const context = await getServerAuth();
  if (!context?.organizationId) return [];

  return db.inventoryLocation.findMany({
    where: { organizationId: context.organizationId, isActive: true },
    select: { id: true, name: true },
  });
}

export async function fulfillStockRequestItems(data: {
  variantId: string;
  fulfillmentType: "TRANSFER" | "PURCHASE";
  fromLocationId?: string; // for TRANSFER
  supplierId?: string; // for PURCHASE
  items: { requestId: string; quantity: number }[];
  notes?: string;
}): Promise<any> {
  const context = await getServerAuth();
  if (!context?.organizationId || !context.memberId)
    throw new Error("Unauthorized");

  const result = await db.$transaction(async tx => {
    // 1. Create the fulfillment record (StockTransfer or Purchase)
    if (data.fulfillmentType === "TRANSFER") {
      if (!data.fromLocationId)
        throw new Error("Source location required for transfer");

      // For transfers, we might need multiple transfers if requests have different target locations
      // But to keep it simple, if they select items from different requests, we should group by target location
      const requests = await tx.stockRequest.findMany({
        where: { id: { in: data.items.map(i => i.requestId) } },
      });

      const targetLocationIds = Array.from(
        new Set(requests.map(r => r.toLocationId)),
      );

      for (const toLocationId of targetLocationIds) {
        const itemsForThisLocation = data.items.filter(i => {
          const req = requests.find(r => r.id === i.requestId);
          return req?.toLocationId === toLocationId;
        });

        if (itemsForThisLocation.length === 0) continue;

        const transferNumber = `TRF-REQ-${Date.now()}`;
        const transfer = await tx.stockTransfer.create({
          data: {
            organizationId: context.organizationId,
            transferNumber,
            fromLocationId: data.fromLocationId,
            toLocationId,
            notes: data.notes || "Fulfillment from aggregated request",
            requestedById: context.memberId,
            status: "PENDING_APPROVAL",
            items: {
              create: await Promise.all(
                itemsForThisLocation.map(async item => {
                  const variant = await tx.productVariant.findUnique({
                    where: { id: data.variantId },
                    select: { buyingPrice: true },
                  });
                  return {
                    variantId: data.variantId,
                    requestedQuantity: new Decimal(item.quantity),
                    unitCost: variant?.buyingPrice || new Decimal(0),
                  };
                }),
              ),
            },
          },
        });

        // Update allocated quantity in StockRequestItem
        for (const item of itemsForThisLocation) {
          await tx.stockRequestItem.updateMany({
            where: {
              stockRequestId: item.requestId,
              variantId: data.variantId,
            },
            data: {
              allocatedQuantity: { increment: item.quantity },
            },
          });
        }
      }
    } else {
      // PURCHASE
      if (!data.supplierId) throw new Error("Supplier required for purchase");

      const purchaseNumber = `PO-REQ-${Date.now()}`;

      const variant = await tx.productVariant.findUnique({
        where: { id: data.variantId },
        select: { buyingPrice: true },
      });
      const unitCost = variant?.buyingPrice || new Decimal(0);

      const totalQuantity = data.items.reduce((acc, i) => acc + i.quantity, 0);
      const totalAmount = unitCost.mul(totalQuantity);

      const purchase = await tx.purchase.create({
        data: {
          organizationId: context.organizationId,
          purchaseNumber,
          supplierId: data.supplierId,
          memberId: context.memberId,
          orderDate: new Date(),
          status: "ORDERED",
          subTotal: totalAmount,
          totalAmount: totalAmount,
          notes: data.notes || "Consolidated procurement from requests",
          items: {
            create: [
              {
                variantId: data.variantId,
                orderedQuantity: totalQuantity,
                unitCost: unitCost,
                totalCost: totalAmount,
              },
            ],
          },
        },
      });

      // Update allocated quantity in StockRequestItem
      for (const item of data.items) {
        await tx.stockRequestItem.updateMany({
          where: { stockRequestId: item.requestId, variantId: data.variantId },
          data: {
            allocatedQuantity: { increment: item.quantity },
          },
        });
      }
    }

    // Update Request Status if fully allocated
    const requestIds = Array.from(new Set(data.items.map(i => i.requestId)));
    for (const rid of requestIds) {
      const items = await tx.stockRequestItem.findMany({
        where: { stockRequestId: rid },
      });

      const allAllocated = items.every(item =>
        new Decimal(item.allocatedQuantity).gte(item.requestedQuantity),
      );

      const someAllocated = items.some(item =>
        new Decimal(item.allocatedQuantity).gt(0),
      );

      await tx.stockRequest.update({
        where: { id: rid },
        data: {
          status: allAllocated
            ? "APPROVED"
            : someAllocated
              ? "PARTIALLY_FULFILLED"
              : "PENDING",
        },
      });
    }

    return { success: true };
  });

  revalidatePath("/stocking/requests");
  return result;
}
