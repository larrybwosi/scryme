import { Test, TestingModule } from '@nestjs/testing';
import { BakeryService } from '../bakery.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../../../auth/auth.service';
import { NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('BakeryService', () => {
  let service: BakeryService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      product: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findFirst: vi.fn(),
      },
      recipe: {
        update: vi.fn(),
      },
      productVariant: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      bakerySettings: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      batch: {
        count: vi.fn(),
        create: vi.fn(),
      },
      bakeryBaker: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
    },
  };

  const mockAuthService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BakeryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<BakeryService>(BakeryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIngredient', () => {
    it('should create a product and a variant', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const data = {
        name: 'Test Flour',
        categoryId: 'cat-1',
        buyingPrice: 10,
      };

      mockPrisma.client.product.create.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.client.productVariant.create.mockResolvedValue({ id: 'var-1' });

      const result = await service.createIngredient(ctx, data);

      expect(mockPrisma.client.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Flour',
          type: 'RAW_MATERIAL',
          organizationId: 'org-1',
        }),
      });
      expect(mockPrisma.client.productVariant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'prod-1',
          buyingPrice: 10,
        }),
      });
      expect(result).toEqual({ id: 'var-1' });
    });
  });

  describe('updateIngredient', () => {
    it('should update a product and its variant', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const id = 'var-1';
      const data = { name: 'Updated Flour' };

      mockPrisma.client.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        productId: 'prod-1',
        product: { organizationId: 'org-1' },
      });

      await service.updateIngredient(ctx, id, data);

      expect(mockPrisma.client.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: expect.objectContaining({ name: 'Updated Flour' }),
      });
    });

    it('should throw NotFoundException if variant not found', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      mockPrisma.client.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.updateIngredient(ctx, 'invalid', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBaker', () => {
    it('should update a baker if it belongs to the organization', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const id = 'baker-1';
      const data = { specialties: ['bread'] };

      mockPrisma.client.bakeryBaker.findFirst.mockResolvedValue({ id: 'baker-1' });
      mockPrisma.client.bakeryBaker.update.mockResolvedValue({ id: 'baker-1', ...data });

      const result = await service.updateBaker(ctx, id, data);

      expect(mockPrisma.client.bakeryBaker.findFirst).toHaveBeenCalledWith({
        where: { id, bakerySettings: { organizationId: 'org-1' } },
      });
      expect(mockPrisma.client.bakeryBaker.update).toHaveBeenCalledWith({
        where: { id },
        data,
      });
      expect(result.specialties).toContain('bread');
    });

    it('should strip organizationId from update data', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      const id = 'recipe-1';
      const data = { name: 'New Recipe', organizationId: 'malicious-org' };

      mockPrisma.client.recipe.update.mockResolvedValue({ id });

      await service.updateRecipe(ctx, id, data);

      expect(mockPrisma.client.recipe.update).toHaveBeenCalledWith({
        where: { id, organizationId: 'org-1' },
        data: { name: 'New Recipe' },
      });
    });

    it('should throw NotFoundException if baker does not belong to the organization', async () => {
      const ctx = { organizationId: 'org-1' } as any;
      mockPrisma.client.bakeryBaker.findFirst.mockResolvedValue(null);

      await expect(service.updateBaker(ctx, 'other-baker', {})).rejects.toThrow(NotFoundException);
    });
  });
});
