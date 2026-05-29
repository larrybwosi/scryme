import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InventoryMovementService } from '../services/inventory-movement.service';
import { MovementType, StockAdjustmentReason } from '@repo/db';
import { Decimal } from 'decimal.js';

export interface UnpackBatchDto {
  batchId: string;
  quantityToUnpack: number; // Number of bulk units to unpack (e.g., 2 Cartons)
  unitsPerPackage: number; // Conversion factor (e.g., 24 pieces/carton)
  damagedQuantity?: number; // Optional: Number of base units found damaged inside
  notes?: string;
  targetSystemUnitId?: string;
  targetOrgUnitId?: string;
}

@Injectable()
export class UnpackBatchUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService
  ) {}

  async execute(organizationId: string, memberId: string, dto: UnpackBatchDto) {
    return this.prisma.client.$transaction(async tx => {
      // 1. Find the bulk batch
      const bulkBatch = await tx.stockBatch.findUnique({
        where: { id: dto.batchId, organizationId },
        include: {
          variant: { include: { product: true } },
          purchaseItem: true,
        },
      });

      if (!bulkBatch) {
        throw new NotFoundException('Bulk stock batch not found.');
      }

      if (new Decimal(bulkBatch.currentQuantity.toString()).lessThan(dto.quantityToUnpack)) {
        throw new BadRequestException('Insufficient quantity in bulk batch.');
      }

      const totalBaseUnitsExpected = new Decimal(dto.quantityToUnpack).mul(dto.unitsPerPackage);
      const damagedQty = new Decimal(dto.damagedQuantity || 0);
      const netBaseUnitsToReceive = totalBaseUnitsExpected.minus(damagedQty);

      if (netBaseUnitsToReceive.isNegative()) {
        throw new BadRequestException('Damaged quantity cannot exceed total units in unpacked packages.');
      }

      // 2. Decrement the bulk batch
      await tx.stockBatch.update({
        where: { id: bulkBatch.id },
        data: {
          currentQuantity: { decrement: dto.quantityToUnpack },
        },
      });

      // 3. Record UNPACK_OUT movement
      await this.inventoryMovementService.recordMovement(tx, {
        organizationId,
        memberId,
        variantId: bulkBatch.variantId,
        quantity: dto.quantityToUnpack,
        fromLocationId: bulkBatch.locationId,
        movementType: MovementType.UNPACK_OUT,
        stockBatchId: bulkBatch.id,
        notes: `Unpacking ${dto.quantityToUnpack} units to ${bulkBatch.variant.product.name}. ${dto.notes || ''}`,
      });

      // 4. Create or update the base unit batch
      // For bookstores, we usually want to consolidate into a base unit batch or create a new child batch
      const baseBatch = await tx.stockBatch.create({
        data: {
          organizationId,
          variantId: bulkBatch.variantId,
          locationId: bulkBatch.locationId,
          batchNumber: `UNPACK-${bulkBatch.batchNumber || Date.now()}`,
          parentId: bulkBatch.id,
          initialQuantity: netBaseUnitsToReceive,
          currentQuantity: netBaseUnitsToReceive,
          purchasePrice: new Decimal(bulkBatch.purchasePrice.toString()).div(dto.unitsPerPackage),
          receivedDate: bulkBatch.receivedDate,
          expiryDate: bulkBatch.expiryDate,
          systemUnitId: dto.targetSystemUnitId,
          orgUnitId: dto.targetOrgUnitId,
          qualityCheckStatus: bulkBatch.qualityCheckStatus,
          supplierId: bulkBatch.supplierId,
        },
      });

      // 5. Record UNPACK_IN movement
      await this.inventoryMovementService.recordMovement(tx, {
        organizationId,
        memberId,
        variantId: bulkBatch.variantId,
        quantity: netBaseUnitsToReceive.toNumber(),
        toLocationId: bulkBatch.locationId,
        movementType: MovementType.UNPACK_IN,
        stockBatchId: baseBatch.id,
        notes: `Received ${netBaseUnitsToReceive} base units from unpacking.`,
      });

      // 6. Handle damages if any
      if (damagedQty.greaterThan(0)) {
        const damagedBatch = await tx.stockBatch.create({
          data: {
            organizationId,
            variantId: bulkBatch.variantId,
            locationId: bulkBatch.locationId,
            batchNumber: `DAMAGED-UNPACK-${bulkBatch.batchNumber || Date.now()}`,
            parentId: bulkBatch.id,
            initialQuantity: damagedQty,
            currentQuantity: 0, // Immediately deducted as adjustment
            purchasePrice: new Decimal(bulkBatch.purchasePrice.toString()).div(dto.unitsPerPackage),
            isQuarantined: true,
            quarantineReason: 'Damaged during unpacking',
            systemUnitId: dto.targetSystemUnitId,
            orgUnitId: dto.targetOrgUnitId,
          },
        });

        const adjustment = await tx.stockAdjustment.create({
          data: {
            organizationId,
            memberId,
            variantId: bulkBatch.variantId,
            stockBatchId: damagedBatch.id,
            locationId: bulkBatch.locationId,
            quantity: damagedQty,
            reason: StockAdjustmentReason.DAMAGED,
            notes: `Found damaged during unpacking of batch ${bulkBatch.batchNumber}`,
          },
        });

        await this.inventoryMovementService.recordMovement(tx, {
          organizationId,
          memberId,
          variantId: bulkBatch.variantId,
          quantity: damagedQty.toNumber(),
          fromLocationId: bulkBatch.locationId,
          movementType: MovementType.ADJUSTMENT_OUT,
          stockBatchId: damagedBatch.id,
          notes: `Adjustment for damages found during unpacking.`,
        });

        // 6a. Auto-create Purchase Return for damages
        if (bulkBatch.supplierId && bulkBatch.purchaseItemId && bulkBatch.purchaseItem?.purchaseId) {
          const returnCount = await tx.purchaseReturn.count({ where: { organizationId } });
          const returnNumber = `RET-UNPACK-${(returnCount + 1).toString().padStart(4, '0')}`;

          await tx.purchaseReturn.create({
            data: {
              organizationId,
              returnNumber,
              supplierId: bulkBatch.supplierId,
              purchaseId: bulkBatch.purchaseItem.purchaseId,
              returnDate: new Date(),
              reason: `Damages found during unpacking of batch ${bulkBatch.batchNumber}: ${dto.notes || 'No notes provided'}`,
              status: 'REQUESTED',
              totalValue: damagedQty.mul(new Decimal(bulkBatch.purchasePrice.toString()).div(dto.unitsPerPackage)),
              items: {
                create: {
                  purchaseItemId: bulkBatch.purchaseItemId,
                  quantity: damagedQty.toNumber(),
                  unitCost: new Decimal(bulkBatch.purchasePrice.toString()).div(dto.unitsPerPackage),
                  totalRefund: damagedQty.mul(new Decimal(bulkBatch.purchasePrice.toString()).div(dto.unitsPerPackage)),
                  reason: 'DAMAGED_ON_UNPACK',
                },
              },
            },
          });
        }
      }

      // 7. Update aggregate stock
      // Since currentStock is in base units (implied by the current calculation service logic),
      // we need to be careful. However, if mixed format is desired, we might need to revisit
      // ProductVariantStock, but for now, we follow the requirement:
      // "Stock Tracking Unit: Yes (know exactly how many individual books are in the building)"
      // This implies currentStock should remain the total Pieces.
      // Unpacking doesn't change total pieces (except for damages).
      if (damagedQty.greaterThan(0)) {
        await tx.productVariantStock.update({
          where: {
            variantId_locationId: {
              variantId: bulkBatch.variantId,
              locationId: bulkBatch.locationId,
            },
          },
          data: {
            currentStock: { decrement: damagedQty },
            availableStock: { decrement: damagedQty },
          },
        });
      }

      return {
        success: true,
        baseBatchId: baseBatch.id,
        unpackedQuantity: dto.quantityToUnpack,
        receivedQuantity: netBaseUnitsToReceive.toNumber(),
        damagedQuantity: damagedQty.toNumber(),
      };
    });
  }
}
