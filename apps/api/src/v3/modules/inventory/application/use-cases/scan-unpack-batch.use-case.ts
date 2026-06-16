import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UnpackBatchUseCase, UnpackBatchDto } from "./unpack-batch.use-case";
import { StockTransferStatus, MovementType } from "@repo/db";
import { Decimal } from "decimal.js";

@Injectable()
export class ScanUnpackBatchUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unpackBatchUseCase: UnpackBatchUseCase,
  ) {}

  async execute(organizationId: string, memberId: string, batchId: string) {
    return this.prisma.client.$transaction(async tx => {
      // 1. Find the batch and its related transfer item
      const batch = await tx.stockBatch.findUnique({
        where: { id: batchId, organizationId },
        include: {
          variant: {
            include: {
              product: true,
              suppliers: true,
            },
          },
          transferItems: {
            include: {
              stockTransfer: true,
            },
            where: {
              stockTransfer: {
                status: {
                  in: [
                    StockTransferStatus.SHIPPED,
                    StockTransferStatus.IN_TRANSIT,
                  ],
                },
              },
            },
          },
        },
      });

      if (!batch) {
        throw new NotFoundException("Stock batch not found.");
      }

      const transferItem = batch.transferItems[0];
      if (!transferItem) {
        throw new BadRequestException(
          "Batch is not associated with an active transfer (SHIPPED or IN_TRANSIT).",
        );
      }

      const transfer = transferItem.stockTransfer;

      // 2. Mark the transfer item as received
      // In a real scan-to-receive, we usually receive the full quantity of the scanned batch
      const quantityToReceive = new Decimal(batch.currentQuantity.toString());

      await tx.stockTransferItem.update({
        where: { id: transferItem.id },
        data: {
          receivedQuantity: {
            increment: quantityToReceive,
          },
        },
      });

      // 3. Check if all items in the transfer are received to potentially complete the transfer
      // This is simplified; usually, you'd check if all items' receivedQuantity matches shippedQuantity

      // 4. Identify unpack parameters
      const supplierInfo = batch.variant.suppliers.find(
        s => s.supplierId === batch.supplierId,
      );

      const unitsPerPackage =
        supplierInfo?.unitsPerPackage != null
          ? new Decimal(supplierInfo.unitsPerPackage.toString()).toNumber()
          : 24; // Default fallback

      const unpackDto: UnpackBatchDto = {
        batchId: batch.id,
        quantityToUnpack: new Decimal(
          batch.currentQuantity.toString(),
        ).toNumber(),
        unitsPerPackage,
        targetSystemUnitId: batch.variant.baseUnitId,
        targetOrgUnitId: batch.variant.baseOrgUnitId,
        notes: `Auto-unpacked via QR scan from transfer ${transfer.transferNumber}`,
      };

      // 5. Call UnpackBatchUseCase logic (we use the transaction-aware logic)
      // Since UnpackBatchUseCase.execute starts its own transaction, we need to be careful.
      // NestJS UseCases usually don't easily allow passing 'tx'.
      // However, we can refactor UnpackBatchUseCase to have a method that accepts 'tx' or just re-implement here.
      // Looking at the existing code, it uses tx.client.$transaction.

      // Re-implementing the core logic here to ensure it's in the SAME transaction

      const totalBaseUnitsExpected = new Decimal(
        unpackDto.quantityToUnpack,
      ).mul(unpackDto.unitsPerPackage);
      const netBaseUnitsToReceive = totalBaseUnitsExpected; // Assuming no damages during auto-scan-unpack

      // Decrement the bulk batch
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: {
          currentQuantity: { decrement: unpackDto.quantityToUnpack },
        },
      });

      // Create the base unit batch at the NEW location (the destination of the transfer)
      // Note: During transfer receipt, the batch might still be at the 'fromLocation' in the DB until received.
      // But the batch record itself should be moved or a new one created at the destination.

      const baseBatch = await tx.stockBatch.create({
        data: {
          organizationId,
          variantId: batch.variantId,
          locationId: transfer.toLocationId, // Move to destination location
          batchNumber: `UNPACK-${batch.batchNumber || Date.now()}`,
          parentId: batch.id,
          initialQuantity: netBaseUnitsToReceive,
          currentQuantity: netBaseUnitsToReceive,
          purchasePrice: new Decimal(batch.purchasePrice.toString()).div(
            unitsPerPackage,
          ),
          receivedDate: new Date(),
          expiryDate: batch.expiryDate,
          systemUnitId: unpackDto.targetSystemUnitId,
          orgUnitId: unpackDto.targetOrgUnitId,
          qualityCheckStatus: batch.qualityCheckStatus,
          supplierId: batch.supplierId,
        },
      });

      // Record Movements
      await tx.stockMovement.create({
        data: {
          organizationId,
          memberId,
          variantId: batch.variantId,
          quantity: unpackDto.quantityToUnpack,
          fromLocationId: transfer.fromLocationId,
          movementType: MovementType.TRANSFER, // It's being received and unpacked
          stockBatchId: batch.id,
          referenceType: "StockTransfer",
          referenceId: transfer.id,
          notes: `Shipped and unpacked via QR scan.`,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId,
          memberId,
          variantId: batch.variantId,
          quantity: netBaseUnitsToReceive,
          toLocationId: transfer.toLocationId,
          movementType: MovementType.UNPACK_IN,
          stockBatchId: baseBatch.id,
          notes: `Received and unpacked from transfer ${transfer.transferNumber}`,
        },
      });

      // Update aggregate stock at destination
      await tx.productVariantStock.upsert({
        where: {
          variantId_locationId: {
            variantId: batch.variantId,
            locationId: transfer.toLocationId,
          },
        },
        update: {
          currentStock: { increment: netBaseUnitsToReceive },
          availableStock: { increment: netBaseUnitsToReceive },
        },
        create: {
          organizationId,
          productId: batch.variant.productId,
          variantId: batch.variantId,
          locationId: transfer.toLocationId,
          currentStock: netBaseUnitsToReceive,
          availableStock: netBaseUnitsToReceive,
        },
      });

      // Check if transfer should be marked as COMPLETED or RECEIVED
      // For simplicity, we just keep it in its current state or mark as RECEIVED if it's the last item
      // But usually, receiving one item might mark it as IN_TRANSIT -> RECEIVED or COMPLETED

      return {
        success: true,
        transferNumber: transfer.transferNumber,
        productName: batch.variant.product.name,
        unpackedQuantity: unpackDto.quantityToUnpack,
        receivedQuantity: netBaseUnitsToReceive.toNumber(),
        baseBatchId: baseBatch.id,
      };
    });
  }
}
