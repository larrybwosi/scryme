import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TraceBatchUseCase } from './trace-batch.use-case';
import { IStockBatchRepository } from '../../domain/repositories/stock-batch-repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('TraceBatchUseCase', () => {
  let useCase: TraceBatchUseCase;
  let repository: any;

  beforeEach(() => {
    repository = {
      findById: vi.fn() as any as any,
      findByBatchNumber: vi.fn() as any as any,
      getTraceability: vi.fn() as any as any,
    };
    useCase = new TraceBatchUseCase(repository);
  });

  it('should return traceability for a valid batch ID', async () => {
    const mockBatch = { id: 'batch-1', organizationId: 'org-1' };
    repository.findById.mockResolvedValue(mockBatch);
    repository.getTraceability.mockResolvedValue({ ...mockBatch, movements: [] });

    const result = await useCase.execute('org-1', 'batch-1');

    expect(repository.findById).toHaveBeenCalledWith('batch-1');
    expect(repository.getTraceability).toHaveBeenCalledWith('batch-1');
    expect(result.id).toBe('batch-1');
  });

  it('should return traceability for a valid batch number if ID not found', async () => {
    const mockBatch = { id: 'batch-1', organizationId: 'org-1', batchNumber: 'BCH-001' };
    repository.findById.mockResolvedValue(null);
    repository.findByBatchNumber.mockResolvedValue(mockBatch);
    repository.getTraceability.mockResolvedValue({ ...mockBatch, movements: [] });

    const result = await useCase.execute('org-1', 'BCH-001');

    expect(repository.findById).toHaveBeenCalledWith('BCH-001');
    expect(repository.findByBatchNumber).toHaveBeenCalledWith('BCH-001', 'org-1');
    expect(repository.getTraceability).toHaveBeenCalledWith('batch-1');
  });

  it('should throw NotFoundException if batch not found', async () => {
    repository.findById.mockResolvedValue(null);
    repository.findByBatchNumber.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'unknown')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if batch belongs to another organization', async () => {
    repository.findById.mockResolvedValue({ id: 'batch-1', organizationId: 'other-org' });

    await expect(useCase.execute('org-1', 'batch-1')).rejects.toThrow(NotFoundException);
  });
});
