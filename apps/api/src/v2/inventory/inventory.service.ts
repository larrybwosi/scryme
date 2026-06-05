import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { realtimeService } from "@repo/shared";
import type { V2ApiContext } from "@repo/shared/server";
import { paginate } from "../../v3/common/utils/pagination";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const {
      page = 1,
      limit = 100,
      locationId,
      productId,
      variantId,
      lowStock = "false",
    } = query;

    const offset = (Number(page) - 1) * Number(limit);

    try {
      const where: any = {
        variant: {
          product: {
            organizationId,
          },
        },
      };

      if (locationId) where.locationId = locationId;
      if (variantId) where.variantId = variantId;
      if (productId) {
        where.variant = { ...where.variant, productId };
      }

      const result = await paginate(
        this.prisma.client.productVariantStock,
        { offset: Number(offset), limit: Number(limit) },
        where,
        { updatedAt: "desc" },
        {
          /**
           * ⚡ Bolt: Performance Optimization
           * Use nested select to prune heavy relation fields while keeping the parent model intact.
           * This pattern prevents regressions while reducing the data load from relations.
           */
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                productId: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                baseUnit: true,
                baseOrgUnit: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      );

      // Data Shaping and Low Stock Filtering
      let shaped = result.data.map((s: any) => ({
        stockId: s.id,
        productId: s.variant?.product?.id,
        productName: s.variant?.product?.name,
        variantId: s.variant?.id,
        variantName: s.variant?.name,
        sku: s.variant?.sku,
        locationId: s.location?.id ?? null,
        locationName: s.location?.name ?? null,
        availableStock: s.availableStock,
        reorderPoint: s.reorderPoint,
        reorderQty: s.reorderQty,
        isLowStock:
          s.reorderPoint !== null
            ? Number(s.availableStock) <= Number(s.reorderPoint)
            : false,
      }));

      if (lowStock === "true") {
        shaped = shaped.filter((item: any) => item.isLowStock);
      }

      return {
        data: shaped,
        totalCount: result.total,
        currentPage: Number(page),
        totalPages: Math.ceil(result.total / Number(limit)),
        limit: Number(limit),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to fetch inventory");
    }
  }

  async createInventoryItem(ctx: V2ApiContext, data: any) {
    return this.prisma.client.productVariantStock.create({
      data: { ...data },
    });
  }

  async getInventoryItem(ctx: V2ApiContext, id: string) {
    const stock = await this.prisma.client.productVariantStock.findUnique({
      where: { id },
      include: {
        variant: { include: { product: true } },
        location: true,
      },
    });
    if (!stock) throw new NotFoundException("Inventory item not found");
    return { data: stock };
  }

  async updateInventoryItem(ctx: V2ApiContext, id: string, data: any) {
    return this.prisma.client.productVariantStock.update({
      where: { id },
      data,
    });
  }

  async deleteInventoryItem(ctx: V2ApiContext, id: string) {
    return this.prisma.client.productVariantStock.delete({
      where: { id },
    });
  }

  async getInventoryMovements(ctx: V2ApiContext, inventoryId: string) {
    return this.prisma.client.stockMovement.findMany({
      where: {
        OR: [{ fromLocationId: inventoryId }, { toLocationId: inventoryId }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createInventoryMovement(
    ctx: V2ApiContext,
    inventoryId: string,
    data: any,
  ) {
    return this.prisma.client.stockMovement.create({
      data: { ...data },
    });
  }

  async getInventoryAdjustments(ctx: V2ApiContext, inventoryId: string) {
    return this.prisma.client.stockAdjustment.findMany({
      where: { variantId: inventoryId },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveInventoryAdjustment(
    ctx: V2ApiContext,
    inventoryId: string,
    adjustmentId: string,
  ) {
    return this.prisma.client.stockAdjustment.update({
      where: { id: adjustmentId },
      data: { status: "APPROVED" as any },
    });
  }

  async adjustStock(data: any) {
    const {
      productId,
      variantId,
      locationId,
      quantity,
      reason,
      notes,
      userId,
    } = data;

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Find or create the stock record
      const stockRecord = await tx.productVariantStock.findFirst({
        where: {
          variantId: variantId || undefined,
          locationId,
        },
      });

      const previousStock = stockRecord
        ? Number(stockRecord.availableStock)
        : 0;
      const newStock = previousStock + quantity;

      if (stockRecord) {
        await tx.productVariantStock.update({
          where: { id: stockRecord.id },
          data: {
            availableStock: { increment: quantity },
            currentStock: { increment: quantity },
          },
        });
      } else {
        // If variantId is not provided, we might have an issue since productVariantStock needs it.
        // But for POS we usually have variantId.
        if (!variantId)
          throw new Error("variantId is required to adjust stock");

        await tx.productVariantStock.create({
          data: {
            organization: { connect: { id: data.organizationId } },
            product: { connect: { id: productId } },
            variant: { connect: { id: variantId } },
            location: { connect: { id: locationId } },
            availableStock: quantity,
            currentStock: quantity,
          },
        });
      }

      // 2. Log the movement
      const movement = await tx.stockMovement.create({
        data: {
          organizationId: data.organizationId,

          variantId,
          fromLocationId: quantity < 0 ? locationId : null,
          toLocationId: quantity > 0 ? locationId : null,
          quantity: Math.abs(quantity),
          movementType: reason.toUpperCase(),
          notes,
          memberId: userId !== "system" ? userId : undefined,
        },
      });

      return {
        previousStock,
        newStock,
        adjustment: quantity,
        logId: movement.id,
        productId,
        variantId,
        locationId,
      };
    });
  }

  async adjustStockAndPublish(data: any) {
    const result = await this.adjustStock(data);

    // Publish update
    await realtimeService.publish(
      `organization:${data.organizationId}:inventory`,
      "stock-update",
      {
        productId: result.productId,
        variantId: result.variantId,
        locationId: result.locationId,
        newStock: result.newStock,
      },
    );

    return result;
  }

  async getLocations(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
    });
    return { data: locations };
  }

  async createLocation(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.inventoryLocation.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async getLocation(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });
    if (!location) throw new NotFoundException("Location not found");
    return { data: location };
  }

  async updateLocation(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.inventoryLocation.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteLocation(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.inventoryLocation.delete({
      where: { id, organizationId },
    });
  }

  async getStockRequests(ctx: V2ApiContext, query: any) {
    const { page = 1, limit = 50 } = query;
    const offset = (Number(page) - 1) * Number(limit);

    return paginate(
      this.prisma.client.stockRequest,
      { offset: Number(offset), limit: Number(limit) },
      { organizationId: ctx.organizationId },
      { requestDate: "desc" },
      {
        include: {
          fromLocation: true,
          toLocation: true,
          requestedBy: { include: { user: true } },
        },
      },
    );
  }

  async getStockTransfers(ctx: V2ApiContext, query: any) {
    const { page = 1, limit = 50 } = query;
    const offset = (Number(page) - 1) * Number(limit);

    return paginate(
      this.prisma.client.stockTransfer,
      { offset: Number(offset), limit: Number(limit) },
      { organizationId: ctx.organizationId },
      { requestedDate: "desc" },
      {
        include: {
          fromLocation: true,
          toLocation: true,
          requestedBy: { include: { user: true } },
        },
      },
    );
  }

  async getStockRequest(ctx: V2ApiContext, id: string) {
    const request = await this.prisma.client.stockRequest.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: { include: { user: true } },
        approvedBy: { include: { user: true } },
        organization: true,
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

    if (!request) throw new NotFoundException("Stock request not found");
    return request;
  }

  async getStockTransfer(ctx: V2ApiContext, id: string) {
    const transfer = await this.prisma.client.stockTransfer.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: { include: { user: true } },
        approvedBy: { include: { user: true } },
        shippedBy: { include: { user: true } },
        receivedBy: { include: { user: true } },
        organization: true,
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

    if (!transfer) throw new NotFoundException("Stock transfer not found");
    return transfer;
  }
}
