import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ApprovalRequestType, ApprovalStatus } from "@repo/db";
import { InventoryMovementService } from "../services/inventory-movement.service";
import { emitStockAdjustment } from "@repo/shared/server";

@Injectable()
export class RequestStockAdjustmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    memberId: string,
    data: {
      variantId: string;
      locationId: string;
      quantity: number;
      reason: any; // StockAdjustmentReason
      notes?: string;
      stockBatchId?: string;
    },
  ) {
    // SECURITY (Sentinel): Verify that linked resources belong to the authenticated tenant
    const [variant, location] = await Promise.all([
      this.prisma.client.productVariant.findFirst({
        where: { id: data.variantId, product: { organizationId } },
      }),
      this.prisma.client.inventoryLocation.findFirst({
        where: { id: data.locationId, organizationId },
      }),
    ]);

    if (!variant) throw new NotFoundException("Product variant not found");
    if (!location) throw new NotFoundException("Inventory location not found");

    if (data.stockBatchId) {
      const batch = await this.prisma.client.stockBatch.findFirst({
        where: { id: data.stockBatchId, organizationId },
      });
      if (!batch) throw new NotFoundException("Stock batch not found");
    }

    return this.prisma.client.$transaction(async tx => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          organizationId,
          memberId,
          variantId: data.variantId,
          locationId: data.locationId,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes,
          stockBatchId: data.stockBatchId,
          status: "PENDING",
        },
        include: {
          variant: { include: { product: true } },
          location: true,
        },
      });

      // Create Approval Request
      await tx.approvalRequest.create({
        data: {
          organizationId,
          requesterId: memberId,
          requestType: ApprovalRequestType.STOCK_ADJUSTMENT,
          relatedId: adjustment.id,
          relatedRecordNumber: `ADJ-${adjustment.id.slice(-6)}`,
          amount: 0, // Stock adjustments might not have a direct financial amount in the same way
          status: ApprovalStatus.PENDING,
        },
      });

      // Emit Windmill Event
      await emitStockAdjustment(organizationId, {
        adjustmentId: adjustment.id,
        variantName: `${adjustment.variant.product.name} ${adjustment.variant.name || ""}`,
        locationName: adjustment.location.name,
        quantity: Number(adjustment.quantity),
        reason: String(adjustment.reason),
        notes: adjustment.notes || undefined,
      }).catch(err =>
        console.error(
          "[v3 StockAdjustment] Failed to emit Windmill event:",
          err,
        ),
      );

      return adjustment;
    });
  }
}

@Injectable()
export class ApproveStockAdjustmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  async execute(
    organizationId: string,
    approvalMemberId: string,
    adjustmentId: string,
  ) {
    return this.prisma.client.$transaction(async tx => {
      /**
       * OPTIMIZATION (Bolt ⚡): Eager load the variant relation's productId on stockAdjustment.
       * This gives us O(1) direct access to `adjustment.variant.productId`, completely avoiding
       * the sequential nested database query on `tx.productVariant.findUnique` inside the transaction.
       */
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockAdjustment lacks a composite unique index on [id, organizationId].
      const adjustment = await tx.stockAdjustment.findFirst({
        where: { id: adjustmentId, organizationId },
        include: { variant: { select: { productId: true } } },
      });

      if (!adjustment)
        throw new NotFoundException("Adjustment request not found");
      if (adjustment.status !== "PENDING")
        throw new BadRequestException("Adjustment is not in PENDING status");

      // 1. Update adjustment status
      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: "APPROVED",
          approvedById: approvalMemberId,
          approvedAt: new Date(),
        },
      });

      // 2. Update stock levels
      const isIncrement =
        [
          "FOUND",
          "ADJUSTMENT_IN",
          "INITIAL_STOCK",
          "CUSTOMER_RETURN",
          "TRANSFER_IN",
        ].includes(adjustment.reason as string) || adjustment.quantity.gt(0);
      const quantityChange = adjustment.quantity;

      // Update variant stock summary
      await tx.productVariantStock.upsert({
        where: {
          variantId_locationId: {
            variantId: adjustment.variantId,
            locationId: adjustment.locationId,
          },
        },
        create: {
          organizationId,
          productId: adjustment.variant.productId,
          variantId: adjustment.variantId,
          locationId: adjustment.locationId,
          currentStock: quantityChange,
          availableStock: quantityChange,
        },
        update: {
          currentStock: { increment: quantityChange },
          availableStock: { increment: quantityChange },
        },
      });

      // 3. Update batch if specified
      if (adjustment.stockBatchId) {
        await tx.stockBatch.update({
          where: { id: adjustment.stockBatchId },
          data: {
            currentQuantity: { increment: quantityChange },
          },
        });
      }

      // 4. Create movement record via unified service
      await this.inventoryMovementService.recordMovement(tx, {
        organizationId,
        memberId: adjustment.memberId,
        variantId: adjustment.variantId,
        quantity: Math.abs(Number(adjustment.quantity)),
        fromLocationId: isIncrement ? null : adjustment.locationId,
        toLocationId: isIncrement ? adjustment.locationId : null,
        movementType: isIncrement ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
        stockBatchId: adjustment.stockBatchId || undefined,
        referenceId: adjustment.id,
        referenceType: "StockAdjustment",
        notes: adjustment.notes || undefined,
      });

      // 5. Update corresponding ApprovalRequest status to APPROVED
      await tx.approvalRequest.updateMany({
        where: {
          organizationId,
          relatedId: adjustmentId,
          requestType: ApprovalRequestType.STOCK_ADJUSTMENT,
        },
        data: {
          status: ApprovalStatus.APPROVED,
        },
      });

      return updatedAdjustment;
    });
  }
}

@Injectable()
export class GetStockAdjustmentsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    query: { limit?: number; offset?: number; status?: string },
  ) {
    const { limit = 20, offset = 0, status } = query;
    const where: any = { organizationId };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.client.stockAdjustment.findMany({
        where,
        include: {
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          member: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.client.stockAdjustment.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }
}

@Injectable()
export class RejectStockAdjustmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    approvalMemberId: string,
    adjustmentId: string,
    reason?: string,
  ) {
    return this.prisma.client.$transaction(async tx => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockAdjustment lacks a composite unique index on [id, organizationId].
      const adjustment = await tx.stockAdjustment.findFirst({
        where: { id: adjustmentId, organizationId },
      });

      if (!adjustment)
        throw new NotFoundException("Adjustment request not found");
      if (adjustment.status !== "PENDING")
        throw new BadRequestException("Adjustment is not in PENDING status");

      // 1. Update adjustment status
      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: "REJECTED",
          approvedById: approvalMemberId,
          approvedAt: new Date(),
          notes: reason ? `${adjustment.notes || ""}\nRejected reason: ${reason}` : adjustment.notes,
        },
      });

      // 2. Update corresponding ApprovalRequest status to REJECTED
      await tx.approvalRequest.updateMany({
        where: {
          organizationId,
          relatedId: adjustmentId,
          requestType: ApprovalRequestType.STOCK_ADJUSTMENT,
        },
        data: {
          status: ApprovalStatus.REJECTED,
        },
      });

      return updatedAdjustment;
    });
  }
}
