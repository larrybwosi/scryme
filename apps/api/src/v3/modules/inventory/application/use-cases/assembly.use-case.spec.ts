import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssemblyUseCase } from './assembly.use-case';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      stockBatch: {
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      productVariantStock: {
        update: vi.fn(),
        updateMany: vi.fn(),
        upsert: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      productVariant: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findFirstOrThrow: vi.fn(),
        count: vi.fn(),
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

  describe('create', () => {
    it('should throw NotFoundException if target variant does not belong to organization', async () => {
      mockTx.productVariant.findFirst.mockResolvedValue(null);

      await expect(
        useCase.create('org-1', 'member-1', {
          name: 'Test',
          variantId: 'v-1',
          quantity: 1,
          items: []
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if component variants do not belong to organization', async () => {
      mockTx.productVariant.findFirst.mockResolvedValue({ id: 'v-1' });
      mockTx.productVariant.count.mockResolvedValue(0); // 0 instead of 1

      await expect(
        useCase.create('org-1', 'member-1', {
          name: 'Test',
          variantId: 'v-1',
          quantity: 1,
          items: [{ variantId: 'comp-1', quantity: 1 }]
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock batches do not belong to organization', async () => {
      mockTx.productVariant.findFirst.mockResolvedValue({ id: 'v-1' });
      mockTx.productVariant.count.mockResolvedValue(1);
      mockTx.stockBatch.count.mockResolvedValue(0); // Batch not found for org

      await expect(
        useCase.create('org-1', 'member-1', {
          name: 'Test',
          variantId: 'v-1',
          quantity: 1,
          items: [{ variantId: 'comp-1', quantity: 1, stockBatchId: 'batch-1' }]
        })
      ).rejects.toThrow(BadRequestException);
    });
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

    it('should throw NotFoundException if assembly does not belong to organization', async () => {
      mockTx.inventoryLocation.findFirst.mockResolvedValue({ id: 'loc-1' });
      mockTx.assembly.findFirst.mockResolvedValue(null);

      await expect(
        useCase.complete('org-1', 'member-1', 'assembly-1', 'loc-1')
      ).rejects.toThrow(NotFoundException);

      expect(mockTx.assembly.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'assembly-1', organizationId: 'org-1' }
      }));
    });

    it('should proceed if location and assembly ownership are verified', async () => {
      mockTx.inventoryLocation.findFirst.mockResolvedValue({ id: 'loc-1' });
      mockTx.assembly.findFirst.mockResolvedValue({
        id: 'assembly-1',
        status: 'PLANNED',
        items: [],
        assemblyNumber: 'ASY-1',
        variantId: 'variant-1',
        quantity: 10
      });
      mockTx.stockBatch.create.mockResolvedValue({ id: 'new-batch-1' });
      mockTx.assembly.updateMany.mockResolvedValue({ count: 1 });
      mockTx.productVariant.findFirstOrThrow.mockResolvedValue({ productId: 'prod-1' });

      const result = await useCase.complete('org-1', 'member-1', 'assembly-1', 'loc-1');

      expect(mockTx.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: 'loc-1', organizationId: 'org-1' },
      });
      expect(result.id).toBe('assembly-1');
      expect(mockTx.assembly.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'assembly-1', organizationId: 'org-1' }
      }));
    });
  });
});
