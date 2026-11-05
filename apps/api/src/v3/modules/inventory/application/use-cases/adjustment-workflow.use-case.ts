import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ApprovalRequestType, ApprovalStatus, MovementType, SerialNumberStatus } from "@repo/db";
import { InventoryMovementService } from "../services/inventory-movement.service";
import { emitStockAdjustment } from "@repo/shared/server";

@Injectable()
export class RequestStockAdjustmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

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
      serialNumbers?: string[];
      attachmentIds?: string[];
      autoApprove?: boolean;
    },
  ) {
    const [variant, location, member] = await Promise.all([
      this.prisma.client.productVariant.findFirst({
        where: { id: data.variantId, product: { organizationId } },
      }),
      this.prisma.client.inventoryLocation.findFirst({
        where: { id: data.locationId, organizationId },
      }),
      this.prisma.client.member?.findFirst
        ? this.prisma.client.member.findFirst({
            where: { id: memberId, organizationId },
          })
        : Promise.resolve(null),
    ]);

    if (!variant) throw new NotFoundException("Product variant not found");
    if (!location) throw new NotFoundException("Inventory location not found");

    if (data.stockBatchId) {
      const batch = await this.prisma.client.stockBatch.findFirst({
        where: { id: data.stockBatchId, organizationId },
      });
      if (!batch) throw new NotFoundException("Stock batch not found");
    }

    const isPrivileged =
      member && (member.role === "OWNER" || member.role === "ADMIN");
    const shouldAutoApprove = data.autoApprove || isPrivileged;

    return this.prisma.client.$transaction(async (tx) => {
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
          status: shouldAutoApprove ? "APPROVED" : "PENDING",
          approvedById: shouldAutoApprove ? memberId : null,
          approvedAt: shouldAutoApprove ? new Date() : null,
        },
        include: {
          variant: { include: { product: true } },
          location: true,
        },
      });

      if (data.attachmentIds && data.attachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: { id: { in: data.attachmentIds }, organizationId },
          data: { stockAdjustmentId: adjustment.id },
        });
      }

      if (!shouldAutoApprove) {
        await tx.approvalRequest.create({
          data: {
            organizationId,
            requesterId: memberId,
            requestType: ApprovalRequestType.STOCK_ADJUSTMENT,
            relatedId: adjustment.id,
            relatedRecordNumber: `ADJ-${adjustment.id.slice(-6)}`,
            amount: 0,
            status: ApprovalStatus.PENDING,
          },
        });
      } else {
        const isIncrement =
          [
            "FOUND",
            "ADJUSTMENT_IN",
            "INITIAL_STOCK",
            "CUSTOMER_RETURN",
            "TRANSFER_IN",
          ].includes(adjustment.reason as string) || Number(adjustment.quantity) > 0;
        const quantityChange = adjustment.quantity;

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

        if (adjustment.stockBatchId) {
          await tx.stockBatch.update({
            where: { id: adjustment.stockBatchId },
            data: { currentQuantity: { increment: quantityChange } },
          });
        } else if (Number(quantityChange) > 0) {
          const newBatch = await tx.stockBatch.create({
            data: {
              organizationId,
              variantId: adjustment.variantId,
              locationId: adjustment.locationId,
              initialQuantity: quantityChange,
              currentQuantity: quantityChange,
              purchasePrice: adjustment.variant.buyingPrice || 0,
              receivedDate: new Date(),
              batchNumber: `ADJ-${adjustment.id.slice(-6)}`,
            },
          });
          adjustment.stockBatchId = newBatch.id;
        }

        await this.inventoryMovementService.recordMovement(tx, {
          organizationId,
          memberId: adjustment.memberId,
          variantId: adjustment.variantId,
          quantity: Math.abs(Number(adjustment.quantity)),
          fromLocationId: isIncrement ? null : adjustment.locationId,
          toLocationId: isIncrement ? adjustment.locationId : null,
          movementType: isIncrement ? MovementType.ADJUSTMENT_IN : MovementType.ADJUSTMENT_OUT,
          stockBatchId: adjustment.stockBatchId || undefined,
          referenceId: adjustment.id,
          referenceType: "StockAdjustment",
          notes: adjustment.notes || undefined,
          serialNumbers: data.serialNumbers,
        });
      }

      await emitStockAdjustment(organizationId, {
        adjustmentId: adjustment.id,
        variantName: `${adjustment.variant.product.name} ${adjustment.variant.name || ""}`,
        locationName: adjustment.location.name,
        quantity: Number(adjustment.quantity),
        reason: String(adjustment.reason),
        notes: adjustment.notes || undefined,
      }).catch((err) =>
        console.error("[v3 StockAdjustment] Failed to emit Windmill event:", err),
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
    serialNumbers?: string[],
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findFirst({
        where: { id: adjustmentId, organizationId },
        include: { variant: { select: { productId: true } } },
      });

      if (!adjustment)
        throw new NotFoundException("Adjustment request not found");
      if (adjustment.status !== "PENDING")
        throw new BadRequestException("Adjustment is not in PENDING status");

      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: "APPROVED",
          approvedById: approvalMemberId,
          approvedAt: new Date(),
        },
      });

      const isIncrement =
        [
          "FOUND",
          "ADJUSTMENT_IN",
          "INITIAL_STOCK",
          "CUSTOMER_RETURN",
          "TRANSFER_IN",
        ].includes(adjustment.reason as string) || Number(adjustment.quantity) > 0;
      const quantityChange = adjustment.quantity;

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

      if (adjustment.stockBatchId) {
        await tx.stockBatch.update({
          where: { id: adjustment.stockBatchId },
          data: {
            currentQuantity: { increment: quantityChange },
          },
        });
      } else if (Number(quantityChange) > 0) {
        const newBatch = await tx.stockBatch.create({
          data: {
            organizationId,
            variantId: adjustment.variantId,
            locationId: adjustment.locationId,
            initialQuantity: quantityChange,
            currentQuantity: quantityChange,
            purchasePrice: (adjustment.variant as any).buyingPrice || 0,
            receivedDate: new Date(),
            batchNumber: `ADJ-${adjustment.id.slice(-6)}`,
          },
        });
        adjustment.stockBatchId = newBatch.id;
      }

      await this.inventoryMovementService.recordMovement(tx, {
        organizationId,
        memberId: adjustment.memberId,
        variantId: adjustment.variantId,
        quantity: Math.abs(Number(adjustment.quantity)),
        fromLocationId: isIncrement ? null : adjustment.locationId,
        toLocationId: isIncrement ? adjustment.locationId : null,
        movementType: isIncrement ? MovementType.ADJUSTMENT_IN : MovementType.ADJUSTMENT_OUT,
        stockBatchId: adjustment.stockBatchId || undefined,
        referenceId: adjustment.id,
        referenceType: "StockAdjustment",
        notes: adjustment.notes || undefined,
        serialNumbers,
      });

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
          attachments: true,
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
    return this.prisma.client.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findFirst({
        where: { id: adjustmentId, organizationId },
      });

      if (!adjustment)
        throw new NotFoundException("Adjustment request not found");
      if (adjustment.status !== "PENDING")
        throw new BadRequestException("Adjustment is not in PENDING status");

      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: "REJECTED",
          approvedById: approvalMemberId,
          approvedAt: new Date(),
          notes: reason ? `${adjustment.notes || ""}\nRejected reason: ${reason}` : adjustment.notes,
        },
      });

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
