import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiRealtimeService } from "../../common/services/realtime.service";
import type { V2ApiContext } from "@repo/shared/api/v2";
import { paginate } from "../../v3/common/utils/pagination";

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private realtime: ApiRealtimeService,
  ) {}

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
        organizationId,
      };

      if (locationId) where.locationId = locationId;
      if (variantId) where.variantId = variantId;
      if (productId) where.productId = productId;

      if (lowStock === "true") {
        where.availableStock = {
          lte: this.prisma.client.productVariantStock.fields.reorderPoint,
        };
      }

      const result = await paginate(
        this.prisma.client.productVariantStock,
        { offset: Number(offset), limit: Number(limit) },
        where,
        { updatedAt: "desc" },
        {
          /**
           * ⚡ Bolt: Performance Optimization
           * Use targeted select instead of include to fetch only essential scalar fields and relations.
           * This reduces database payload size and serialization overhead.
           */
          select: {
            id: true,
            availableStock: true,
            reorderPoint: true,
            reorderQty: true,
            productId: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
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

      // Data Shaping
      const shaped = result.data.map((s: any) => ({
        stockId: s.id,
        productId: s.productId,
        productName: s.product?.name,
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

      return {
        data: shaped,
        totalCount: result.meta.total,
        currentPage: Number(page),
        totalPages: Math.ceil(result.meta.total / Number(limit)),
        limit: Number(limit),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to fetch inventory");
    }
  }

  async createInventoryItem(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    const {
      productId,
      variantId,
      locationId,
      currentStock,
      availableStock,
      reorderPoint,
      reorderQty,
    } = data;

    return this.prisma.client.productVariantStock.create({
      data: {
        productId,
        variantId,
        locationId,
        currentStock,
        availableStock,
        reorderPoint,
        reorderQty,
        organizationId,
      },
    });
  }

  async getInventoryItem(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const stock = await this.prisma.client.productVariantStock.findFirst({
      where: { id, organizationId },
      include: {
        variant: { include: { product: true } },
        location: true,
      },
    });
    if (!stock) throw new NotFoundException("Inventory item not found");
    return { data: stock };
  }

  async updateInventoryItem(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;

    // SECURITY (Sentinel): Whitelist allowed fields to prevent mass assignment.
    const {
      currentStock,
      availableStock,
      reorderPoint,
      reorderQty,
      reservedStock,
    } = data;

    const updateData: any = {};
    if (currentStock !== undefined) updateData.currentStock = currentStock;
    if (availableStock !== undefined) updateData.availableStock = availableStock;
    if (reorderPoint !== undefined) updateData.reorderPoint = reorderPoint;
    if (reorderQty !== undefined) updateData.reorderQty = reorderQty;
    if (reservedStock !== undefined) updateData.reservedStock = reservedStock;

    // Use updateMany with a filter on organizationId to ensure multi-tenant isolation.
    // Prisma's update does not support non-unique filters.
    const result = await this.prisma.client.productVariantStock.updateMany({
      where: { id, organizationId },
      data: updateData,
    });

    if (result.count === 0) {
      throw new NotFoundException("Inventory item not found");
    }

    // Fetch the updated record to return it, maintaining current service contract.
    return this.getInventoryItem(ctx, id);
  }

  async deleteInventoryItem(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;

    const result = await this.prisma.client.productVariantStock.deleteMany({
      where: { id, organizationId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Inventory item not found");
    }

    return { success: true };
  }

  async getInventoryMovements(ctx: V2ApiContext, inventoryId: string) {
    const { organizationId } = ctx;
    return this.prisma.client.stockMovement.findMany({
      where: {
        organizationId,
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
    const { organizationId } = ctx;

    // SECURITY (Sentinel): Validate that the inventory item belongs to the organization
    const inventoryItem = await this.prisma.client.productVariantStock.findFirst({
      where: { id: inventoryId, organizationId },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Inventory item not found");
    }

    // SECURITY (Sentinel): Explicit field whitelisting and context enforcement.
    const {
      variantId,
      stockBatchId,
      quantity,
      fromLocationId,
      toLocationId,
      movementType,
      notes,
      referenceId,
      referenceType,
    } = data;

    return this.prisma.client.stockMovement.create({
      data: {
        variantId: variantId || inventoryItem.variantId,
        stockBatchId,
        quantity,
        fromLocationId,
        toLocationId,
        movementType,
        notes,
        referenceId,
        referenceType,
        organizationId,
        memberId: ctx.memberId || data.memberId || "system",
      },
    });
  }

  async getInventoryAdjustments(ctx: V2ApiContext, inventoryId: string) {
    const { organizationId } = ctx;
    return this.prisma.client.stockAdjustment.findMany({
      where: {
        organizationId,
        variantId: inventoryId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveInventoryAdjustment(
    ctx: V2ApiContext,
    inventoryId: string,
    adjustmentId: string,
  ) {
    const { organizationId } = ctx;

    const result = await this.prisma.client.stockAdjustment.updateMany({
      where: { id: adjustmentId, organizationId },
      data: {
        status: "APPROVED" as any,
        approvedById: ctx.memberId,
        approvedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Stock adjustment not found");
    }

    return { success: true };
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

    return this.prisma.client.$transaction(async tx => {
      // 1. Find or create the stock record
      const stockRecord = await tx.productVariantStock.findFirst({
        where: {
          variantId: variantId || undefined,
          locationId,
          organizationId: data.organizationId,
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
    await this.realtime.publish(
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

    const locationCount = await this.prisma.client.inventoryLocation.count({
      where: { organizationId },
    });

    if (locationCount <= 1) {
      throw new BadRequestException(
        "Cannot delete the last location in the system. At least one location is required.",
      );
    }

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
        /**
         * ⚡ Bolt: Performance Optimization
         * Using 'select' instead of 'include' to prune large JSON fields from locations
         * and unnecessary member data. This reduces database I/O and payload size.
         */
        select: {
          id: true,
          requestNumber: true,
          status: true,
          priority: true,
          requestDate: true,
          totalEstimatedCost: true,
          fromLocation: { select: { id: true, name: true, code: true } },
          toLocation: { select: { id: true, name: true, code: true } },
          requestedBy: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
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
        /**
         * ⚡ Bolt: Performance Optimization
         * Using 'select' instead of 'include' to prune large JSON fields from locations
         * and unnecessary member data. This reduces database I/O and payload size.
         */
        select: {
          id: true,
          transferNumber: true,
          status: true,
          priority: true,
          requestedDate: true,
          shippedDate: true,
          receivedDate: true,
          fromLocation: { select: { id: true, name: true, code: true } },
          toLocation: { select: { id: true, name: true, code: true } },
          requestedBy: {
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
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
