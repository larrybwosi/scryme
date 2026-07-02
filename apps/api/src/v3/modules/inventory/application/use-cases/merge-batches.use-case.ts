import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { IStockBatchRepository } from "../../domain/repositories/stock-batch-repository.interface";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MergeBatchesUseCase {
  constructor(
    @Inject(IStockBatchRepository)
    private readonly stockBatchRepository: IStockBatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    organizationId: string,
    memberId: string,
    batchIds: string[],
    targetLocationId: string,
    notes?: string,
  ) {
    if (batchIds.length < 2) {
      throw new BadRequestException(
        "At least two batches are required for merging",
      );
    }

    // OPTIMIZATION (Bolt ⚡): Use findByIds to fetch all batches in a single database roundtrip,
    // eliminating the N+1 query pattern where findById was called for each batch ID.
    const rawBatches = await this.stockBatchRepository.findByIds(batchIds);
    const batchesMap = new Map(rawBatches.map((b) => [b.id, b]));
    // Map ensures we preserve input order and handle missing IDs (as nulls) for validation.
    const batches = batchIds.map((id) => batchesMap.get(id) || null);

    // Validation
    const firstBatch = batches[0];
    if (!firstBatch || firstBatch.organizationId !== organizationId) {
      throw new NotFoundException(`Batch ${batchIds[0]} not found`);
    }

    for (const batch of batches) {
      if (!batch || batch.organizationId !== organizationId) {
        throw new NotFoundException(
          `Batch ${batchIds[batches.indexOf(batch)] || "unknown"} not found`,
        );
      }
      if (batch.variantId !== firstBatch.variantId) {
        throw new BadRequestException(
          "All batches must be of the same product variant",
        );
      }
    }

    const totalQuantity = batches.reduce(
      (sum, b) => sum + (b?.currentQuantity || 0),
      0,
    );

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Create the merged target batch
      const mergedBatch = await tx.stockBatch.create({
        data: {
          organizationId,
          variantId: firstBatch.variantId,
          locationId: targetLocationId,
          initialQuantity: totalQuantity,
          currentQuantity: totalQuantity,
          purchasePrice: firstBatch.purchasePrice, // Weighted average would be better in production
          receivedDate: new Date(),
          batchNumber: `MERGED-${Date.now()}`,
        },
      });

      // OPTIMIZATION (Bolt ⚡): Use updateMany and createMany to perform bulk database writes,
      // replacing the sequential loop that issued N updates and N creates.
      // This reduces database write roundtrips from 2N to 2.

      // 2. Deplete source batches
      await tx.stockBatch.updateMany({
        where: { id: { in: batchIds } },
        data: { currentQuantity: 0 },
      });

      // 3. Create audit trail (movements)
      const movements = batches.map((batch) => ({
        organizationId,
        variantId: batch!.variantId,
        stockBatchId: batch!.id,
        quantity: batch!.currentQuantity,
        fromLocationId: batch!.locationId,
        toLocationId: targetLocationId,
        movementType: "ADJUSTMENT_OUT" as const,
        memberId,
      }));

      await tx.stockMovement.createMany({ data: movements });

      await tx.stockMovement.create({
        data: {
          organizationId,
          variantId: firstBatch.variantId,
          stockBatchId: mergedBatch.id,
          quantity: totalQuantity,
          fromLocationId: null,
          toLocationId: targetLocationId,
          movementType: "ADJUSTMENT_IN",
          memberId,
        },
      });

      return mergedBatch;
    });
  }
}
