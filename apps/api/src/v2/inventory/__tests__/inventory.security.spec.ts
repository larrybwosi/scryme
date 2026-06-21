import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '@/prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService Security (IDOR)', () => {
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
                findUnique: vi.fn(),
                findFirst: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getInventoryItem IDOR protection', () => {
    it('should throw NotFoundException if item belongs to a different organization', async () => {
      const ctx = { organizationId: 'my-org' } as any;
      const itemId = 'other-org-item-id';

      // Mock finding the item, it returns null when filtered by organizationId
      (prisma.client.productVariantStock.findFirst as any).mockResolvedValue(null);

      // After fix, it should throw NotFoundException
      await expect(service.getInventoryItem(ctx, itemId)).rejects.toThrow(NotFoundException);

      expect(prisma.client.productVariantStock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId, organizationId: 'my-org' }
        })
      );
    });
  });
});
