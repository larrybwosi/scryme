import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    product: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    category: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    inventoryLocation: { findFirst: vi.fn() },
  },
}));

vi.mock('@repo/shared/server', () => ({
  V2ApiContext: {},
}));

import { CatalogService } from '../catalog.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { SupplierService } from '@repo/suppliers/server';
import { V2ApiContext } from '@repo/shared/server';

describe('CatalogService Security', () => {
  let service: CatalogService;

  const ctx: V2ApiContext = { organizationId: 'org-1', memberId: 'mem-1' } as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: PrismaService,
          useValue: { client: mockDb },
        },
        {
          provide: SupplierService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {
            get: vi.fn(),
            setex: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('createProduct', () => {
    it('should ignore organizationId in data and use context', async () => {
      mockDb.category.findFirst.mockResolvedValue({ id: 'cat-1', organizationId: 'org-1' });
      mockDb.product.create.mockResolvedValue({ id: 'prod-1' });

      await service.createProduct(ctx, { name: 'Test', organizationId: 'other-org', categoryId: 'cat-1' });

      expect(mockDb.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          name: 'Test',
        }),
      });
      // Ensure organizationId 'other-org' was not used
      const callData = mockDb.product.create.mock.calls[0][0].data;
      expect(callData.organizationId).toBe('org-1');
    });

    it('should throw BadRequestException if categoryId belongs to another organization', async () => {
      mockDb.category.findFirst.mockResolvedValue(null); // Not found in this org

      await expect(service.createProduct(ctx, { name: 'Test', categoryId: 'evil-cat' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if defaultLocationId belongs to another organization', async () => {
      mockDb.category.findFirst.mockResolvedValue({ id: 'cat-1', organizationId: 'org-1' });
      mockDb.inventoryLocation.findFirst.mockResolvedValue(null); // Not found in this org

      await expect(service.createProduct(ctx, { name: 'Test', categoryId: 'cat-1', defaultLocationId: 'evil-loc' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProduct', () => {
    it('should throw NotFoundException if product does not belong to organization', async () => {
      mockDb.product.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.updateProduct(ctx, 'prod-1', { name: 'Updated' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should ignore organizationId in update data', async () => {
      mockDb.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId: 'org-1' });
      mockDb.product.update.mockResolvedValue({ id: 'prod-1' });

      await service.updateProduct(ctx, 'prod-1', { name: 'Updated', organizationId: 'other-org' });

      expect(mockDb.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1', organizationId: 'org-1' },
        data: expect.not.objectContaining({ organizationId: 'other-org' }),
      });
    });

    it('should throw BadRequestException if updating to a categoryId from another organization', async () => {
      mockDb.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId: 'org-1' });
      mockDb.category.findFirst.mockResolvedValue(null);

      await expect(service.updateProduct(ctx, 'prod-1', { categoryId: 'evil-cat' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createCategory', () => {
    it('should ignore organizationId in data and use context', async () => {
      mockDb.category.create.mockResolvedValue({ id: 'cat-1' });

      await service.createCategory(ctx, { name: 'Cat', organizationId: 'other-org' });

      expect(mockDb.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          name: 'Cat',
        }),
      });
    });

    it('should throw BadRequestException if parentId belongs to another organization', async () => {
      mockDb.category.findFirst.mockResolvedValue(null);

      await expect(service.createCategory(ctx, { name: 'Subcat', parentId: 'evil-parent' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCategory', () => {
    it('should throw NotFoundException if category does not belong to organization', async () => {
      mockDb.category.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.updateCategory(ctx, 'cat-1', { name: 'Updated' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updating to a parentId from another organization', async () => {
      mockDb.category.findFirst.mockResolvedValue(null); // Parent check

      await expect(service.updateCategory(ctx, 'cat-1', { parentId: 'evil-parent' }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
