import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MovementType, SerialNumberStatus } from '@repo/db';

export interface MovementData {
  organizationId: string;
  memberId: string;
  variantId: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  movementType: MovementType;
  stockBatchId?: string;
  serialNumbers?: string[];
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}

@Injectable()
export class InventoryMovementService {
  private readonly logger = new Logger(InventoryMovementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordMovement(tx: any, data: MovementData) {
    const {
      organizationId,
      memberId,
      variantId,
      quantity,
      fromLocationId,
      toLocationId,
      movementType,
      stockBatchId,
      serialNumbers,
      referenceId,
      referenceType,
      notes,
    } = data;

    // Validate quantity is not negative
    if (quantity < 0) {
      throw new BadRequestException('Movement quantity cannot be negative');
    }

    // 1. Create Stock Movement record
    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        memberId,
        variantId,
        quantity,
        fromLocationId,
        toLocationId,
        movementType,
        stockBatchId,
        referenceId,
        referenceType,
        notes,
        serialNumbers: serialNumbers
          ? {
              connect: serialNumbers.map(sn => ({
                organizationId_serialNumber: { organizationId, serialNumber: sn },
              })),
            }
          : undefined,
      },
    });

    // 2. Update Serial Number statuses if applicable
    if (serialNumbers && serialNumbers.length > 0) {
      let newStatus: SerialNumberStatus = SerialNumberStatus.IN_STOCK;

      if (movementType === MovementType.SALE) newStatus = SerialNumberStatus.SOLD;
      else if (movementType === MovementType.TRANSFER) newStatus = SerialNumberStatus.TRANSFERRED;
      else if (movementType === MovementType.ADJUSTMENT_OUT) newStatus = SerialNumberStatus.DAMAGED;
      else if (movementType === MovementType.SUPPLIER_RETURN) newStatus = SerialNumberStatus.RETURNED;

      await tx.serialNumber.updateMany({
        where: {
          organizationId,
          serialNumber: { in: serialNumbers },
        },
        data: {
          status: newStatus,
          locationId: toLocationId || fromLocationId,
        },
      });
    }

    // 3. Verify Stock Integrity (Automated Check)
    await this.verifyIntegrity(tx, organizationId, variantId, fromLocationId, toLocationId);

    this.logger.log(`Recorded ${movementType} movement for variant ${variantId} (qty: ${quantity})`);

    return movement;
  }

  private async verifyIntegrity(tx: any, organizationId: string, variantId: string, fromLoc?: string, toLoc?: string) {
    const locationIds = [fromLoc, toLoc].filter(Boolean) as string[];

    for (const locationId of locationIds) {
      const stock = await tx.productVariantStock.findUnique({
        where: { variantId_locationId: { variantId, locationId } },
      });

      const batches = await tx.stockBatch.findMany({
        where: { organizationId, variantId, locationId, currentQuantity: { gt: 0 } },
      });

      const totalBatchQty = batches.reduce((acc: number, b: any) => acc + Number(b.currentQuantity), 0);
      const currentStock = Number(stock?.currentStock || 0);

      if (Math.abs(totalBatchQty - currentStock) > 0.001) {
        this.logger.error(
          `[Integrity Alert] Stock mismatch for variant ${variantId} at location ${locationId}. Stock: ${currentStock}, Batches: ${totalBatchQty}`
        );
        // In highly strict enterprise systems, we might block the transaction here.
      }
    }
  }
}
