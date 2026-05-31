import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '@/prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              productVariantStock: {
                findMany: vi.fn(),
                count: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getInventory', () => {
    it('should return paginated inventory data with correct filters', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const query = { page: 1, limit: 10, productId: 'prod-1' };

      const mockStocks = [
        {
          id: 'stock-1',
          availableStock: 10,
          reorderPoint: 5,
          variant: {
            id: 'v1',
            sku: 'SKU1',
            product: { id: 'prod-1', name: 'Product 1' },
          },
          location: { id: 'l1', name: 'Location 1' },
        },
      ];

      (prisma.client.productVariantStock.findMany as any).mockResolvedValue(mockStocks);
      (prisma.client.productVariantStock.count as any).mockResolvedValue(1);

      const result = await service.getInventory(ctx, query);

      // Verify that direct filters are used instead of nested relations
      expect(prisma.client.productVariantStock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-1',
            productId: 'prod-1',
          },
        }),
      );

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(1);
      const item = result.data[0];
      expect(item.sku).toBe('SKU1');
      expect(item.availableStock).toBe(10);
      expect(item.isLowStock).toBe(false);
    });

    it('should correctly identify low stock items', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const query = { page: 1, limit: 10 };

      const mockStocks = [
        {
          id: 'stock-low',
          availableStock: 2,
          reorderPoint: 5,
          variant: {
            id: 'v2',
            sku: 'SKU-LOW',
            product: { id: 'p2', name: 'Product 2' },
          },
          location: { id: 'l1', name: 'Location 1' },
        },
      ];

      (prisma.client.productVariantStock.findMany as any).mockResolvedValue(mockStocks);
      (prisma.client.productVariantStock.count as any).mockResolvedValue(1);

      const result = await service.getInventory(ctx, query);

      expect(result.data[0].isLowStock).toBe(true);
    });
  });
});
