import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IStockBatchRepository } from '../../domain/repositories/stock-batch-repository.interface';

@Injectable()
export class TraceBatchUseCase {
  constructor(
    @Inject(IStockBatchRepository)
    private readonly stockBatchRepository: IStockBatchRepository,
  ) {}

  async execute(organizationId: string, identifier: string) {
    // identifier could be ID or BatchNumber
    let batch = await this.stockBatchRepository.findById(identifier);

    if (!batch) {
      batch = await this.stockBatchRepository.findByBatchNumber(identifier, organizationId);
    }

    if (!batch || batch.organizationId !== organizationId) {
      throw new NotFoundException(`Batch with identifier ${identifier} not found`);
    }

    return this.stockBatchRepository.getTraceability(batch.id);
  }
}
