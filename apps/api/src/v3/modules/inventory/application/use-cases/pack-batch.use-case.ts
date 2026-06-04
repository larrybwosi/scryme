import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InventoryMovementService } from '../services/inventory-movement.service';
import { MovementType } from '@repo/db';
import { Decimal } from 'decimal.js';
import { PackBatchDto } from '../dto/pack-batch.dto';
export { PackBatchDto };

@Injectable()
export class PackBatchUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService
  ) {}

  async execute(organizationId: string, memberId: string, dto: PackBatchDto) {
    return this.prisma.client.$transaction(async tx => {
      // 1. Find the base batch
      const baseBatch = await tx.stockBatch.findUnique({
        where: { id: dto.batchId, organizationId },
        include: {
          variant: { include: { product: true } },
        },
      });

      if (!baseBatch) {
        throw new NotFoundException('Base stock batch not found.');
      }

      if (new Decimal(baseBatch.currentQuantity.toString()).lessThan(dto.quantityToPack)) {
        throw new BadRequestException('Insufficient quantity in base batch.');
      }

      const bulkQuantity = new Decimal(dto.quantityToPack).div(dto.unitsPerPackage);

      // Ensure we are packing whole bulk units (optional, but usually preferred)
      if (!bulkQuantity.isInteger()) {
        throw new BadRequestException('Quantity to pack must result in whole bulk units.');
      }

      // 2. Decrement the base batch
      await tx.stockBatch.update({
        where: { id: baseBatch.id },
        data: {
          currentQuantity: { decrement: dto.quantityToPack },
        },
      });

      // 3. Record PACK_OUT movement
      await this.inventoryMovementService.recordMovement(tx, {
        organizationId,
        memberId,
        variantId: baseBatch.variantId,
        quantity: dto.quantityToPack,
        fromLocationId: baseBatch.locationId,
        movementType: MovementType.PACK_OUT,
        stockBatchId: baseBatch.id,
        notes: `Packing ${dto.quantityToPack} units to bulk. ${dto.notes || ''}`,
      });

      // 4. Create the bulk batch
      const bulkBatch = await tx.stockBatch.create({
        data: {
          organizationId,
          variantId: baseBatch.variantId,
          locationId: baseBatch.locationId,
          batchNumber: `PACK-${baseBatch.batchNumber || Date.now()}`,
          parentId: baseBatch.id,
          initialQuantity: bulkQuantity,
          currentQuantity: bulkQuantity,
          purchasePrice: new Decimal(baseBatch.purchasePrice.toString()).mul(dto.unitsPerPackage),
          receivedDate: baseBatch.receivedDate,
          expiryDate: baseBatch.expiryDate,
          systemUnitId: dto.targetSystemUnitId,
          orgUnitId: dto.targetOrgUnitId,
          qualityCheckStatus: baseBatch.qualityCheckStatus,
          supplierId: baseBatch.supplierId,
        },
      });

      // 5. Record PACK_IN movement
      await this.inventoryMovementService.recordMovement(tx, {
        organizationId,
        memberId,
        variantId: baseBatch.variantId,
        quantity: bulkQuantity.toNumber(),
        toLocationId: baseBatch.locationId,
        movementType: MovementType.PACK_IN,
        stockBatchId: bulkBatch.id,
        notes: `Received ${bulkQuantity} bulk units from packing.`,
      });

      return {
        success: true,
        bulkBatchId: bulkBatch.id,
        packedQuantity: dto.quantityToPack,
        receivedBulkQuantity: bulkQuantity.toNumber(),
      };
    });
  }
}
