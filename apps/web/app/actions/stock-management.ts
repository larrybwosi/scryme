"use server";

import { db, Decimal, StockTransferStatus, MovementType, AlertStatus } from "@repo/db";
import { getOrganizationContext } from "./auth";
import { revalidatePath } from "next/cache";
import { startOfMonth, subMonths, format, endOfMonth, startOfDay, endOfDay } from "date-fns";

export async function getStockDashboardStats(): Promise<any> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return null;

  const [totalProducts, totalStockValue, pendingTransfers, lowStockAlerts] = await Promise.all([
    db.product.count({ where: { organizationId: context.organizationId } }),
    db.productVariantStock.aggregate({
      where: { organizationId: context.organizationId },
      _sum: { currentStock: true }
    }),
    db.stockTransfer.count({
      where: {
        organizationId: context.organizationId,
        status: { in: ["PENDING_APPROVAL", "SHIPPED", "IN_TRANSIT"] }
      }
    }),
    db.productVariantStock.count({
      where: {
        organizationId: context.organizationId,
        currentStock: { lte: 10 } // Simplified for now as Prisma doesn't support field-to-field comparison easily
      }
    })
  ]);

  // For total value, we ideally want currentStock * buyingPrice.
  // This aggregate only gives sum of stock. We'll do a more detailed query if needed.
  // For now, let's just get the count of items in stock as a placeholder or a simple sum.

  return {
    totalProducts,
    totalStockItems: totalStockValue._sum.currentStock?.toNumber() || 0,
    pendingTransfers,
    lowStockAlerts
  };
}

export async function getStockMovementsChartData(): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM")
    };
  }).reverse();

  const data = await Promise.all(last6Months.map(async (month) => {
    const movements = await db.stockMovement.groupBy({
      by: ['movementType'],
      where: {
        organizationId: context.organizationId,
        movementDate: {
          gte: month.start,
          lte: month.end
        }
      },
      _sum: {
        quantity: true
      }
    });

    const inbound = movements
      .filter(m => ["PURCHASE_RECEIPT", "ADJUSTMENT_IN", "TRANSFER", "CUSTOMER_RETURN"].includes(m.movementType))
      .reduce((acc, m) => acc + (m._sum.quantity?.toNumber() || 0), 0);

    const outbound = movements
      .filter(m => ["SALE", "ADJUSTMENT_OUT", "SUPPLIER_RETURN"].includes(m.movementType))
      .reduce((acc, m) => acc + Math.abs(m._sum.quantity?.toNumber() || 0), 0);

    return {
      name: month.label,
      inbound,
      outbound
    };
  }));

  return data;
}

export async function getStockDistributionByLocation(): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  const distribution = await db.productVariantStock.groupBy({
    by: ['locationId'],
    where: { organizationId: context.organizationId },
    _sum: {
      currentStock: true
    }
  });

  const locations = await db.inventoryLocation.findMany({
    where: { id: { in: distribution.map(d => d.locationId) } },
    select: { id: true, name: true }
  });

  return distribution.map(d => ({
    name: locations.find(l => l.id === d.locationId)?.name || "Unknown",
    value: d._sum.currentStock?.toNumber() || 0
  }));
}

export async function getStockTransferList(): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.stockTransfer.findMany({
    where: { organizationId: context.organizationId },
    include: {
      fromLocation: { select: { name: true } },
      toLocation: { select: { name: true } },
      requestedBy: { select: { user: { select: { name: true } } } }
    },
    orderBy: { requestedDate: 'desc' }
  });
}

export async function createStockTransfer(data: {
  fromLocationId: string;
  toLocationId: string;
  items: { variantId: string; quantity: number }[];
  notes?: string;
}): Promise<any> {
  const context = await getOrganizationContext();
  if (!context?.organizationId || !context.user.id) throw new Error("Unauthorized");

  const transferNumber = `TRF-${Date.now()}`;

  const result = await db.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.create({
      data: {
        organizationId: context.organizationId,
        transferNumber,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        notes: data.notes,
        requestedById: context.user.id,
        status: "PENDING_APPROVAL",
        items: {
          create: await Promise.all(data.items.map(async (item) => {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { buyingPrice: true }
            });
            return {
              variantId: item.variantId,
              requestedQuantity: new Decimal(item.quantity),
              unitCost: variant?.buyingPrice || new Decimal(0)
            };
          }))
        }
      }
    });

    return transfer;
  });

  revalidatePath("/stocking/transfers");
  return result;
}

export async function getStockTransferDetails(id: string): Promise<any> {
  const context = await getOrganizationContext();
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
              product: true
            }
          }
        }
      }
    }
  });
}

export async function updateStockTransferStatus(id: string, status: StockTransferStatus, notes?: string): Promise<any> {
  const context = await getOrganizationContext();
  if (!context?.organizationId || !context.user.id) throw new Error("Unauthorized");

  const transfer = await db.stockTransfer.findUnique({
    where: { id, organizationId: context.organizationId },
    include: { items: true }
  });

  if (!transfer) throw new Error("Transfer not found");

  const result = await db.$transaction(async (tx) => {
    const updateData: any = { status };

    if (status === "APPROVED") {
      updateData.approvedById = context.user.id;
    } else if (status === "SHIPPED") {
      updateData.shippedById = context.user.id;
      updateData.shippedDate = new Date();

      // Deduct stock from source location
      for (const item of transfer.items) {
        await tx.productVariantStock.update({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.fromLocationId
            }
          },
          data: {
            currentStock: { decrement: item.requestedQuantity },
            availableStock: { decrement: item.requestedQuantity }
          }
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
            memberId: context.user.id,
            notes: `Transfer ${transfer.transferNumber} Shipped`
          }
        });
      }
    } else if (status === "COMPLETED") {
      updateData.receivedById = context.user.id;
      updateData.receivedDate = new Date();
      updateData.completedDate = new Date();

      // Add stock to destination location
      for (const item of transfer.items) {
        const stock = await tx.productVariantStock.findUnique({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.toLocationId
            }
          }
        });

        if (stock) {
          await tx.productVariantStock.update({
            where: { id: stock.id },
            data: {
              currentStock: { increment: item.requestedQuantity },
              availableStock: { increment: item.requestedQuantity }
            }
          });
        } else {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          await tx.productVariantStock.create({
            data: {
              organizationId: context.organizationId,
              productId: variant!.productId,
              variantId: item.variantId,
              locationId: transfer.toLocationId,
              currentStock: item.requestedQuantity,
              availableStock: item.requestedQuantity
            }
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
            memberId: context.user.id,
            notes: `Transfer ${transfer.transferNumber} Completed`
          }
        });
      }
    }

    return tx.stockTransfer.update({
      where: { id },
      data: updateData
    });
  });

  revalidatePath(`/stocking/transfers/${id}`);
  revalidatePath("/stocking/transfers");
  return result;
}

export async function getProductStockDistribution(productId: string): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.productVariantStock.findMany({
    where: {
      productId,
      organizationId: context.organizationId
    },
    include: {
      location: true,
      variant: true
    }
  });
}

export async function getStockMovementHistory(params: {
  variantId?: string;
  locationId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.stockMovement.findMany({
    where: {
      organizationId: context.organizationId,
      variantId: params.variantId,
      OR: params.locationId ? [
        { fromLocationId: params.locationId },
        { toLocationId: params.locationId }
      ] : undefined,
      movementDate: {
        gte: params.startDate,
        lte: params.endDate
      }
    },
    include: {
      variant: { include: { product: true } },
      fromLocation: true,
      toLocation: true,
      member: { include: { user: true } }
    },
    orderBy: { movementDate: 'desc' },
    take: params.limit || 50
  });
}

export async function getReorderRules(): Promise<any[]> {
  const context = await getOrganizationContext();
  if (!context?.organizationId) return [];

  return db.reorderRule.findMany({
    where: { organizationId: context.organizationId },
    include: {
      product: true,
      variant: true,
      location: true
    }
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
  const context = await getOrganizationContext();
  if (!context?.organizationId) throw new Error("Unauthorized");

  const rule = await db.reorderRule.upsert({
    where: {
      organizationId_productId_variantId_locationId: {
        organizationId: context.organizationId,
        productId: data.productId,
        variantId: data.variantId || null as any,
        locationId: data.locationId
      }
    },
    update: {
      minQuantity: new Decimal(data.minQuantity),
      maxQuantity: new Decimal(data.maxQuantity),
      reorderQuantity: new Decimal(data.reorderQuantity)
    },
    create: {
      organizationId: context.organizationId,
      productId: data.productId,
      variantId: data.variantId,
      locationId: data.locationId,
      minQuantity: new Decimal(data.minQuantity),
      maxQuantity: new Decimal(data.maxQuantity),
      reorderQuantity: new Decimal(data.reorderQuantity)
    }
  });

  revalidatePath("/stocking/reorder-rules");
  return rule;
}
