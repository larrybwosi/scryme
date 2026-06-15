import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {IStockBatchRepository} from "../../domain/repositories/stock-batch-repository.interface";
import {PrismaService} from "@/prisma/prisma.service";

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

    const batches = await Promise.all(
      batchIds.map(id => this.stockBatchRepository.findById(id)),
    );

    // Validation
    const firstBatch = batches[0];
    if (!firstBatch || firstBatch.organizationId !== organizationId) {
      throw new NotFoundException(`Batch ${batchIds[0]} not found`);
    }

    for (const batch of batches) {
      if (!batch || batch.organizationId !== organizationId) {
        throw new NotFoundException(`Batch ${batch.id} not found`);
      }
      if (batch.variantId !== firstBatch.variantId) {
        throw new BadRequestException(
          "All batches must be of the same product variant",
        );
      }
    }

    const totalQuantity = batches.reduce(
      (sum, b) => sum + b.currentQuantity,
      0,
    );

    return this.prisma.client.$transaction(async tx => {
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

      // 2. Deplete and link source batches
      for (const batch of batches) {
        await tx.stockBatch.update({
          where: {id: batch.id},
          data: {
            currentQuantity: 0,
            // We could add a 'mergedIntoId' field if we wanted explicit back-link in schema,
            // but we can use movements for now or add it to schema.
          },
        });

        // Link in genealogy (parent-child)
        // Since we have children/parent relation, merged batch is parent of the source batches?
        // Actually it's the other way around: merged batch's parents are the source batches.
        // But our schema has parentId (singular).
        // For merge (many-to-one), we might need a join table or a different approach for "genealogy".
        // Let's use the parentId on the source batches to point to the merged batch as their "successor".
        // Wait, 'parent' usually means origin.
        // Let's just create movements for now as they are the primary audit trail.

        await tx.stockMovement.create({
          data: {
            organizationId,
            variantId: batch.variantId,
            stockBatchId: batch.id,
            quantity: batch.currentQuantity,
            fromLocationId: batch.locationId,
            toLocationId: targetLocationId,
            movementType: "ADJUSTMENT_OUT",
            memberId,
          },
        });
      }

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
