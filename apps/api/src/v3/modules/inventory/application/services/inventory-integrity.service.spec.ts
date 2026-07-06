import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryIntegrityService } from './inventory-integrity.service';

describe('InventoryIntegrityService Security', () => {
  let service: InventoryIntegrityService;
  let mockTx: any;
  let prisma: any;

  beforeEach(() => {
    mockTx = {
      productVariantStock: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      stockBatch: {
        findMany: vi.fn(),
      },
    };
    prisma = {
      client: mockTx,
    };
    service = new InventoryIntegrityService(prisma as any);
  });

  describe('verifyVariantIntegrity', () => {
    it('should scope productVariantStock.findMany by organizationId', async () => {
      mockTx.productVariantStock.findMany.mockResolvedValue([]);

      await service.verifyVariantIntegrity('org-1', 'variant-1');

      expect(mockTx.productVariantStock.findMany).toHaveBeenCalledWith({
        where: { variantId: 'variant-1', organizationId: 'org-1' },
      });
    });

    it('should scope stockBatch.findMany by organizationId', async () => {
      mockTx.productVariantStock.findMany.mockResolvedValue([
        { locationId: 'loc-1', currentStock: 10 }
      ]);
      mockTx.stockBatch.findMany.mockResolvedValue([]);

      await service.verifyVariantIntegrity('org-1', 'variant-1');

      expect(mockTx.stockBatch.findMany).toHaveBeenCalledWith({
        where: {
          variantId: 'variant-1',
          locationId: 'loc-1',
          currentQuantity: { gt: 0 },
          organizationId: 'org-1',
        },
      });
    });
  });

  describe('fixVariantIntegrity', () => {
    it('should scope stockBatch.findMany by organizationId', async () => {
      mockTx.stockBatch.findMany.mockResolvedValue([]);
      mockTx.productVariantStock.updateMany.mockResolvedValue({ count: 0 });

      await service.fixVariantIntegrity('org-1', 'variant-1', 'loc-1');

      expect(mockTx.stockBatch.findMany).toHaveBeenCalledWith({
        where: {
          variantId: 'variant-1',
          locationId: 'loc-1',
          currentQuantity: { gt: 0 },
          organizationId: 'org-1',
        },
      });
    });

    it('should scope productVariantStock.updateMany by organizationId', async () => {
      mockTx.stockBatch.findMany.mockResolvedValue([{ currentQuantity: 50 }]);
      mockTx.productVariantStock.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.fixVariantIntegrity('org-1', 'variant-1', 'loc-1');

      expect(mockTx.productVariantStock.updateMany).toHaveBeenCalledWith({
        where: { variantId: 'variant-1', locationId: 'loc-1', organizationId: 'org-1' },
        data: {
          currentStock: 50,
          availableStock: 50,
        },
      });
      expect(result.success).toBe(true);
      expect(result.affected).toBe(1);
    });

    it('should return success: false if no records were affected (e.g. wrong org)', async () => {
      mockTx.stockBatch.findMany.mockResolvedValue([{ currentQuantity: 50 }]);
      mockTx.productVariantStock.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.fixVariantIntegrity('org-wrong', 'variant-1', 'loc-1');

      expect(mockTx.productVariantStock.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-wrong' })
      }));
      expect(result.success).toBe(false);
      expect(result.affected).toBe(0);
    });
  });
});
