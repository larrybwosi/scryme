import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SubmitReconciliationDto } from "../dto/reconciliation.dto";
import {
  ReconciliationStatus,
  StockAdjustmentReason,
  AdjustmentStatus,
  MovementType,
} from "@repo/db";
import { PaginationQueryDto, paginate } from "@/v3/common/utils/pagination";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";

@Injectable()
export class PhysicalReconciliationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  async generateCountSheet(organizationId: string, locationId: string) {
    const stock = await this.prisma.client.productVariantStock.findMany({
      where: { organizationId, locationId, currentStock: { gt: 0 } },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    return stock.map((s) => ({
      variantId: s.variantId,
      sku: s.variant.sku,
      name: s.variant.name,
      productName: s.variant.product.name,
      expectedQuantity: Number(s.currentStock),
    }));
  }

  async submit(
    organizationId: string,
    memberId: string,
    dto: SubmitReconciliationDto,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      let totalExpectedValue = 0;
      let totalActualValue = 0;

      const itemsToCreate = [];

      for (const item of dto.items) {
        const stock = await tx.productVariantStock.findUnique({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: dto.locationId,
            },
          },
          include: { variant: true },
        });

        const expectedQty = Number(stock?.currentStock || 0);
        const unitPrice = Number(stock?.variant.buyingPrice || 0);

        const varianceQty = item.actualQuantity - expectedQty;
        const expectedValue = expectedQty * unitPrice;
        const actualValue = item.actualQuantity * unitPrice;
        const varianceValue = actualValue - expectedValue;

        totalExpectedValue += expectedValue;
        totalActualValue += actualValue;

        itemsToCreate.push({
          productVariantId: item.variantId,
          expectedQuantity: expectedQty,
          actualQuantity: item.actualQuantity,
          varianceQuantity: varianceQty,
          expectedValue,
          actualValue,
          varianceValue,
          unitPrice,
          resolutionNotes: item.notes,
        });
      }

      const reconciliation = await tx.stockReconciliation.create({
        data: {
          organizationId,
          locationId: dto.locationId,
          reconciliationDate: new Date(),
          status: ReconciliationStatus.PENDING_REVIEW,
          description: dto.description,
          expectedValue: totalExpectedValue,
          actualValue: totalActualValue,
          varianceValue: totalActualValue - totalExpectedValue,
          initiatedBy: memberId,
          items: {
            create: itemsToCreate,
          },
        },
      });

      return reconciliation;
    });
  }

  async approve(
    organizationId: string,
    memberId: string,
    reconciliationId: string,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const reconciliation = await tx.stockReconciliation.findUnique({
        where: { id: reconciliationId, organizationId },
        include: { items: true },
      });

      if (!reconciliation)
        throw new NotFoundException("Reconciliation not found");
      if (reconciliation.status !== ReconciliationStatus.PENDING_REVIEW) {
        throw new BadRequestException("Reconciliation is not pending review");
      }

      for (const item of reconciliation.items) {
        if (Number(item.varianceQuantity) !== 0) {
          const adjustment = await tx.stockAdjustment.create({
            data: {
              organizationId,
              variantId: item.productVariantId,
              locationId: reconciliation.locationId,
              memberId,
              quantity: item.varianceQuantity,
              reason: StockAdjustmentReason.INVENTORY_COUNT,
              status: AdjustmentStatus.APPROVED,
              notes: `Adjustment from Reconciliation #${reconciliation.id}`,
              approvedById: memberId,
              approvedAt: new Date(),
            },
          });

          await tx.productVariantStock.update({
            where: {
              variantId_locationId: {
                variantId: item.productVariantId,
                locationId: reconciliation.locationId,
              },
            },
            data: {
              currentStock: { increment: item.varianceQuantity },
              availableStock: { increment: item.varianceQuantity },
            },
          });

          // Adjust Batches
          let remainingVariance = Number(item.varianceQuantity);

          if (remainingVariance < 0) {
            // Shrinkage: Deduct from existing batches (FIFO)
            const batches = await tx.stockBatch.findMany({
              where: {
                variantId: item.productVariantId,
                locationId: reconciliation.locationId,
                currentQuantity: { gt: 0 },
              },
              orderBy: { receivedDate: "asc" },
            });

            for (const batch of batches) {
              if (remainingVariance >= 0) break;
              const deduction = Math.min(
                Number(batch.currentQuantity),
                Math.abs(remainingVariance),
              );
              await tx.stockBatch.update({
                where: { id: batch.id },
                data: { currentQuantity: { decrement: deduction } },
              });
              remainingVariance += deduction;
            }
          } else if (remainingVariance > 0) {
            // Found stock: Create a new batch
            await tx.stockBatch.create({
              data: {
                organizationId,
                variantId: item.productVariantId,
                locationId: reconciliation.locationId,
                initialQuantity: remainingVariance,
                currentQuantity: remainingVariance,
                purchasePrice: item.unitPrice,
                receivedDate: new Date(),
                batchNumber: `REC-FOUND-${reconciliation.id.slice(-6)}`,
              },
            });
          }

          await this.inventoryMovementService.recordMovement(tx, {
            organizationId,
            memberId,
            variantId: item.productVariantId,
            quantity: Math.abs(Number(item.varianceQuantity)),
            fromLocationId:
              Number(item.varianceQuantity) < 0
                ? reconciliation.locationId
                : null,
            toLocationId:
              Number(item.varianceQuantity) > 0
                ? reconciliation.locationId
                : null,
            movementType:
              Number(item.varianceQuantity) > 0
                ? MovementType.ADJUSTMENT_IN
                : MovementType.ADJUSTMENT_OUT,
            referenceId: adjustment.id,
            referenceType: "StockAdjustment",
            notes: `Reconciliation adjustment`,
          });
        }

        await tx.reconciliationItem.update({
          where: { id: item.id },
          data: { adjustmentCreated: true, resolutionType: "ADJUST" },
        });
      }

      return tx.stockReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: ReconciliationStatus.COMPLETED,
          completedBy: memberId,
          reviewedBy: memberId,
          completedAt: new Date(),
        },
      });
    });
  }

  async findAll(organizationId: string, pagination: PaginationQueryDto) {
    return paginate(
      this.prisma.client.stockReconciliation,
      pagination,
      { organizationId },
      { reconciliationDate: "desc" },
      { include: { location: true, initiatedByMember: true } },
    );
  }
}
