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

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Deduct from parent
      const parentDeductionPromise = tx.stockBatch.update({
        where: { id: batchId },
        data: {
          currentQuantity: { decrement: totalSplitQuantity },
        },
      });

      // 2. Create child batches and their corresponding movement logs concurrently.
      // OPTIMIZATION (Bolt ⚡): Parallelize the child batch creations and their movement logs using Promise.all.
      // Instead of sequential blocking queries inside the loop, we map splits to independent concurrent promises.
      // This collapses the database write round-trips from O(N) down to a flat O(1) concurrent block,
      // minimizing transaction open duration and locking contention.
      const childPromises = splits.map(async (split, index) => {
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
            batchNumber: `${parentBatch.batchNumber}-S${index + 1}`,
          },
        });

        // Log movement for child batch
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

        return childBatch;
      });

      // Log movement for parent deduction
      const parentMovementPromise = tx.stockMovement.create({
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

      // Execute parent update, child creation blocks, and parent movement log concurrently.
      const [_, createdChildren] = await Promise.all([
        parentDeductionPromise,
        Promise.all(childPromises),
        parentMovementPromise,
      ]);

      return createdChildren;
    });
  }
}
