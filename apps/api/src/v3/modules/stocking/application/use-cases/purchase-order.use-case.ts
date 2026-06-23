import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreatePurchaseDto, ReceivePurchaseDto } from "../dto/purchase.dto";
import {
  PurchaseStatus,
  MovementType,
  QualityCheckStatus,
  SerialNumberStatus,
} from "@repo/db";
import { PaginationQueryDto, paginate } from "@/v3/common/utils/pagination";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";
import { emitPurchaseApprovalRequested } from "@repo/windmill/server";
import { PricingManagementService } from "../../../catalog/application/services/pricing-management.service";
import { AccountingService } from "../../../finance/application/services/accounting.service";

@Injectable()
export class PurchaseOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly pricingManagementService: PricingManagementService,
    private readonly accountingService: AccountingService,
  ) {}

  async create(
    organizationId: string,
    memberId: string,
    dto: CreatePurchaseDto,
  ) {
    const purchaseNumber = `PO-${Date.now()}`;

    return this.prisma.client.$transaction(async (tx) => {
      let subTotal = 0;
      for (const item of dto.items) {
        subTotal += item.orderedQuantity * item.unitCost;
      }

      const purchase = await tx.purchase.create({
        data: {
          organizationId,
          memberId,
          supplierId: dto.supplierId,
          purchaseNumber,
          orderDate: new Date(),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          expectedDate: dto.expectedDate
            ? new Date(dto.expectedDate)
            : undefined,
          currency: dto.currency || "KES",
          subTotal,
          shippingCost: dto.shippingCost || 0,
          totalAmount: subTotal + (dto.shippingCost || 0),
          status: PurchaseStatus.ORDERED,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              variantId: item.variantId,
              orderedQuantity: item.orderedQuantity,
              unitCost: item.unitCost,
              totalCost: item.orderedQuantity * item.unitCost,
              orderedUnitId: item.orderedUnitId,
              orderedOrgUnitId: item.orderedOrgUnitId,
            })),
          },
        },
        include: {
          items: true,
          member: { include: { user: true } },
        },
      });

      // Emit Windmill event for approval
      await emitPurchaseApprovalRequested(organizationId, {
        purchaseOrderId: purchase.id,
        orderNumber: purchase.purchaseNumber,
        requestedBy: purchase.member.user.name || "Unknown",
        totalAmount: Number(purchase.totalAmount),
        currency: purchase.currency,
      }).catch((err) =>
        console.error("[v3 PurchaseOrder] Failed to emit Windmill event:", err),
      );

      return purchase;
    });
  }

  async receive(
    organizationId: string,
    memberId: string,
    purchaseId: string,
    dto: ReceivePurchaseDto,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId, organizationId },
        include: { items: { include: { variant: true } } },
      });

      if (!purchase) throw new NotFoundException("Purchase order not found");
      if (
        purchase.status === PurchaseStatus.COMPLETED ||
        purchase.status === PurchaseStatus.RECEIVED
      ) {
        throw new BadRequestException("Purchase order already received");
      }

      const receipt = await tx.stockReceipt.create({
        data: {
          organizationId,
          memberId,
          purchaseId,
          receivedDate: new Date(),
          notes: dto.notes,
        },
      });

      for (const itemDto of dto.items) {
        const purchaseItem = purchase.items.find(
          (i) => i.id === itemDto.purchaseItemId,
        );
        if (!purchaseItem)
          throw new NotFoundException(
            `Purchase item ${itemDto.purchaseItemId} not found`,
          );

        let totalReceivedForItem = 0;

        for (const batchDto of itemDto.batches) {
          const batch = await tx.stockBatch.create({
            data: {
              organizationId,
              variantId: purchaseItem.variantId,
              purchaseItemId: purchaseItem.id,
              locationId: dto.locationId,
              batchNumber: batchDto.batchNumber || `BAT-${Date.now()}`,
              supplierBatchNumber: batchDto.supplierBatchNumber,
              initialQuantity: batchDto.quantity,
              currentQuantity: batchDto.quantity,
              purchasePrice: purchaseItem.unitCost,
              landedCost: batchDto.landedCost, // Manual entry support
              expiryDate: batchDto.expiryDate
                ? new Date(batchDto.expiryDate)
                : null,
              receivedDate: new Date(),
              storageUnitId: batchDto.storageUnitId,
              positionId: batchDto.positionId,
              supplierId: purchase.supplierId,
              systemUnitId: batchDto.systemUnitId,
              orgUnitId: batchDto.orgUnitId,
            },
          });

          // Handle Serial Numbers if provided
          if (batchDto.serialNumbers && batchDto.serialNumbers.length > 0) {
            await tx.serialNumber.createMany({
              data: batchDto.serialNumbers.map((sn) => ({
                organizationId,
                serialNumber: sn,
                variantId: purchaseItem.variantId,
                stockBatchId: batch.id,
                locationId: dto.locationId,
                status: SerialNumberStatus.IN_STOCK,
              })),
            });
          }

          // Handle QC Results if provided
          if (batchDto.qcResults) {
            await tx.qcResult.create({
              data: {
                organizationId,
                templateId: batchDto.qcResults.templateId,
                stockBatchId: batch.id,
                purchaseItemId: purchaseItem.id,
                data: batchDto.qcResults.data,
                status: batchDto.qcResults.status,
                performedById: memberId,
                notes: batchDto.qcResults.notes,
              },
            });

            // If QC failed, quarantine the batch
            if (batchDto.qcResults.status === QualityCheckStatus.FAILED) {
              await tx.stockBatch.update({
                where: { id: batch.id },
                data: {
                  isQuarantined: true,
                  quarantineReason: "Failed QC on receipt",
                },
              });

              // Update Serial Numbers to Quarantined
              await tx.serialNumber.updateMany({
                where: { stockBatchId: batch.id },
                data: { status: SerialNumberStatus.QUARANTINED },
              });
            }
          }

          await this.inventoryMovementService.recordMovement(tx, {
            organizationId,
            memberId,
            variantId: purchaseItem.variantId,
            stockBatchId: batch.id,
            quantity: batchDto.quantity,
            toLocationId: dto.locationId,
            movementType: MovementType.PURCHASE_RECEIPT,
            serialNumbers: batchDto.serialNumbers,
            referenceId: purchase.id,
            referenceType: "Purchase",
            notes: `Received from PO #${purchase.purchaseNumber}`,
          });

          await tx.productVariantStock.upsert({
            where: {
              variantId_locationId: {
                variantId: purchaseItem.variantId,
                locationId: dto.locationId,
              },
            },
            update: {
              currentStock: { increment: batchDto.quantity },
              availableStock: { increment: batchDto.quantity },
            },
            create: {
              organizationId,
              productId: purchaseItem.variant.productId,
              variantId: purchaseItem.variantId,
              locationId: dto.locationId,
              currentStock: batchDto.quantity,
              availableStock: batchDto.quantity,
            },
          });

          totalReceivedForItem += batchDto.quantity;
        }

        await tx.purchaseItem.update({
          where: { id: purchaseItem.id },
          data: {
            receivedQuantity: { increment: totalReceivedForItem },
            rejectedQuantity: { increment: itemDto.rejectedQuantity || 0 },
            qualityCheckStatus:
              (itemDto.rejectedQuantity || 0) > 0
                ? QualityCheckStatus.FAILED
                : QualityCheckStatus.PASSED,
          },
        });
      }

      const updatedPurchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: { items: true },
      });

      const allReceived = updatedPurchase?.items.every(
        (i) => i.receivedQuantity >= i.orderedQuantity,
      );
      const someReceived = updatedPurchase?.items.some(
        (i) => i.receivedQuantity > 0,
      );

      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: allReceived
            ? PurchaseStatus.RECEIVED
            : someReceived
              ? PurchaseStatus.PARTIALLY_RECEIVED
              : PurchaseStatus.ORDERED,
          receivedDate: allReceived ? new Date() : undefined,
        },
      });

      // Trigger price recalculation for all items received in this PO
      for (const itemDto of dto.items) {
        const purchaseItem = purchase.items.find(
          (i) => i.id === itemDto.purchaseItemId,
        );
        if (purchaseItem) {
          await this.pricingManagementService.handleCostChange(
            {
              organizationId,
              variantId: purchaseItem.variantId,
              source: "PURCHASE_ORDER",
              sourceId: purchaseId,
              newCost: Number(purchaseItem.unitCost),
            },
            tx,
          );
        }
      }

      return receipt;
    });
  }

  async approve(organizationId: string, memberId: string, purchaseId: string) {
    const purchase = await this.prisma.client.purchase.findUnique({
      where: { id: purchaseId, organizationId },
    });

    if (!purchase) throw new NotFoundException("Purchase order not found");

    const updatedPurchase = await this.prisma.client.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.APPROVED,
        updatedAt: new Date(),
      },
    });

    // Post to ledger after approval
    await this.accountingService.postPurchaseToLedger(updatedPurchase.id).catch((err) =>
      console.error("[PurchaseOrderUseCase] Failed to post purchase to ledger:", err),
    );

    return updatedPurchase;
  }

  async findAll(organizationId: string, pagination: PaginationQueryDto) {
    return paginate(
      this.prisma.client.purchase,
      pagination,
      { organizationId },
      { orderDate: "desc" },
      {
        select: {
          id: true,
          purchaseNumber: true,
          orderDate: true,
          status: true,
          totalAmount: true,
          currency: true,
          supplier: { select: { id: true, name: true } },
          member: {
            select: {
              id: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    );
  }
}
