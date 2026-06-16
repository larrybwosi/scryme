import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { IStockBatchRepository } from "../../domain/repositories/stock-batch-repository.interface";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class SplitBatchUseCase {
  constructor(
    @Inject(IStockBatchRepository)
    private readonly stockBatchRepository: IStockBatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    organizationId: string,
    batchId: string,
    memberId: string,
    splits: { quantity: number; notes?: string }[],
  ) {
    const parentBatch = await this.stockBatchRepository.findById(batchId);

    if (!parentBatch || parentBatch.organizationId !== organizationId) {
      throw new NotFoundException("Parent batch not found");
    }

    const totalSplitQuantity = splits.reduce((sum, s) => sum + s.quantity, 0);

    if (totalSplitQuantity > parentBatch.currentQuantity) {
      throw new BadRequestException(
        "Split quantity exceeds current batch quantity",
      );
    }

    return this.prisma.client.$transaction(async tx => {
      // 1. Deduct from parent
      await tx.stockBatch.update({
        where: { id: batchId },
        data: {
          currentQuantity: { decrement: totalSplitQuantity },
        },
      });

      // 2. Create child batches
      const createdChildren = [];
      for (const split of splits) {
        const childBatch = await tx.stockBatch.create({
          data: {
            organizationId,
            variantId: parentBatch.variantId,
            locationId: parentBatch.locationId,
            initialQuantity: split.quantity,
            currentQuantity: split.quantity,
            purchasePrice: parentBatch.purchasePrice,
            expiryDate: parentBatch.expiryDate,
            receivedDate: parentBatch.receivedDate,
            supplierId: parentBatch.supplierId,
            parentId: parentBatch.id,
            batchNumber: `${parentBatch.batchNumber}-S${createdChildren.length + 1}`,
          },
        });

        // 3. Log movement
        await tx.stockMovement.create({
          data: {
            organizationId,
            variantId: parentBatch.variantId,
            stockBatchId: childBatch.id,
            quantity: split.quantity,
            fromLocationId: parentBatch.locationId,
            toLocationId: parentBatch.locationId,
            movementType: "ADJUSTMENT_IN",
            memberId,
            notes: split.notes || `Split from batch ${parentBatch.batchNumber}`,
          },
        });

        createdChildren.push(childBatch);
      }

      // Log movement for parent deduction
      await tx.stockMovement.create({
        data: {
          organizationId,
          variantId: parentBatch.variantId,
          stockBatchId: parentBatch.id,
          quantity: totalSplitQuantity,
          fromLocationId: parentBatch.locationId,
          toLocationId: parentBatch.locationId,
          movementType: "ADJUSTMENT_OUT",
          memberId,
          notes: `Split into ${splits.length} child batches`,
        },
      });

      return createdChildren;
    });
  }
}
