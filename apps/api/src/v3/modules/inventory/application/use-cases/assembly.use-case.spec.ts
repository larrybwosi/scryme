import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssemblyUseCase } from './assembly.use-case';
import { NotFoundException } from '@nestjs/common';

describe('AssemblyUseCase Security', () => {
  let useCase: AssemblyUseCase;
  let mockTx: any;
  let prisma: any;

  beforeEach(() => {
    mockTx = {
      inventoryLocation: {
        findFirst: vi.fn(),
      },
      assembly: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockBatch: {
        update: vi.fn(),
        create: vi.fn(),
      },
      productVariantStock: {
        update: vi.fn(),
        upsert: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      productVariant: {
        findUnique: vi.fn(),
      }
    };
    prisma = {
      client: {
        ...mockTx,
        $transaction: vi.fn(async (cb) => await cb(mockTx)),
      },
    };
    useCase = new AssemblyUseCase(prisma as any);
  });

  describe('complete', () => {
    it('should throw NotFoundException if location does not belong to organization', async () => {
      mockTx.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(
        useCase.complete('org-1', 'member-1', 'assembly-1', 'loc-wrong')
      ).rejects.toThrow(NotFoundException);

      expect(mockTx.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: 'loc-wrong', organizationId: 'org-1' },
      });
    });

    it('should proceed if location ownership is verified', async () => {
      mockTx.inventoryLocation.findFirst.mockResolvedValue({ id: 'loc-1' });
      mockTx.assembly.findUnique.mockResolvedValue({
        id: 'assembly-1',
        status: 'PLANNED',
        items: [],
        assemblyNumber: 'ASY-1',
        variantId: 'variant-1',
        quantity: 10
      });
      mockTx.stockBatch.create.mockResolvedValue({ id: 'new-batch-1' });
      mockTx.assembly.update.mockResolvedValue({ id: 'assembly-1', status: 'COMPLETED' });
      mockTx.productVariant.findUnique.mockResolvedValue({ productId: 'prod-1' });

      const result = await useCase.complete('org-1', 'member-1', 'assembly-1', 'loc-1');

      expect(mockTx.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: 'loc-1', organizationId: 'org-1' },
      });
      expect(result.status).toBe('COMPLETED');
    });
  });
});
