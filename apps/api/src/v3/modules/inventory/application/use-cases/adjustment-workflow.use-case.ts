import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import {ApprovalRequestType, ApprovalStatus} from "@repo/db";
import {InventoryMovementService} from "../services/inventory-movement.service";
import {emitStockAdjustment} from "@repo/windmill/server";

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
          variant: {include: {product: true}},
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
      const adjustment = await tx.stockAdjustment.findUnique({
        where: {id: adjustmentId, organizationId},
      });

      if (!adjustment)
        throw new NotFoundException("Adjustment request not found");
      if (adjustment.status !== "PENDING")
        throw new BadRequestException("Adjustment is not in PENDING status");

      // 1. Update adjustment status
      const updatedAdjustment = await tx.stockAdjustment.update({
        where: {id: adjustmentId},
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
          productId: (await tx.productVariant.findUnique({
            where: {id: adjustment.variantId},
          }))!.productId,
          variantId: adjustment.variantId,
          locationId: adjustment.locationId,
          currentStock: quantityChange,
          availableStock: quantityChange,
        },
        update: {
          currentStock: {increment: quantityChange},
          availableStock: {increment: quantityChange},
        },
      });

      // 3. Update batch if specified
      if (adjustment.stockBatchId) {
        await tx.stockBatch.update({
          where: {id: adjustment.stockBatchId},
          data: {
            currentQuantity: {increment: quantityChange},
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

      return updatedAdjustment;
    });
  }
}
