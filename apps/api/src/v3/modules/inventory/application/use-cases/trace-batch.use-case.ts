import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IStockBatchRepository } from "../../domain/repositories/stock-batch-repository.interface";

@Injectable()
export class TraceBatchUseCase {
  constructor(
    @Inject(IStockBatchRepository)
    private readonly stockBatchRepository: IStockBatchRepository,
  ) {}

  async execute(organizationId: string, identifier: string) {
    // identifier could be ID or BatchNumber
    // ⚡ Bolt Optimization: Most batch lookups pass the actual database ID (which is a CUID starting with 'c', length >= 24).
    // We can directly call getTraceability in a single database query if it is a CUID-like identifier.
    // If it is not found, or not CUID-like, we fall back to the multi-query route (findByBatchNumber, etc.).
    const isCuidLike = identifier.startsWith("c") && identifier.length >= 24;

    if (isCuidLike) {
      const traceBatch = await this.stockBatchRepository.getTraceability(identifier);
      if (traceBatch && traceBatch.organizationId === organizationId) {
        return traceBatch;
      }
    }

    let batch = await this.stockBatchRepository.findById(identifier);

    if (!batch) {
      batch = await this.stockBatchRepository.findByBatchNumber(
        identifier,
        organizationId,
      );
    }

    if (!batch || batch.organizationId !== organizationId) {
      throw new NotFoundException(
        `Batch with identifier ${identifier} not found`,
      );
    }

    return this.stockBatchRepository.getTraceability(batch.id);
  }
}
