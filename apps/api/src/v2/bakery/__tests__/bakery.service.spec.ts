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
});
