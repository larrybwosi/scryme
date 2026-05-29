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
    it('should return paginated inventory data', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const query = { page: 1, limit: 10 };

      const mockStocks = [
        {
          id: 'stock-1',
          availableStock: 10,
          reorderPoint: 5,
          variant: {
            id: 'v1',
            sku: 'SKU1',
            product: { id: 'p1', name: 'Product 1' },
          },
          location: { id: 'l1', name: 'Location 1' },
        },
      ];

      (prisma.client.productVariantStock.findMany as any).mockResolvedValue(mockStocks);
      (prisma.client.productVariantStock.count as any).mockResolvedValue(1);

      const result = await service.getInventory(ctx, query);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(1);
      const item = result.data[0];
      expect(item.sku).toBe('SKU1');
      expect(item.availableStock).toBe(10);
      expect(item.isLowStock).toBe(false);
    });
  });
});
