import { Test, TestingModule } from '@nestjs/testing';
import { BakeryService } from '../bakery.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../../../auth/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

describe('BakeryService completeBatch IDOR', () => {
  let service: BakeryService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
      batch: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockBatch: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      batchIngredientConsumption: {
        create: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      productVariantStock: {
        update: vi.fn(),
        upsert: vi.fn(),
      },
      bakerySettings: {
        findUnique: vi.fn(),
      }
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

  it('SECURITY FIX: should check organizationId when looking up batch', async () => {
    const attackerOrgId = 'attacker-org';
    const victimBatchId = 'victim-batch-id';

    const ctx = { organizationId: attackerOrgId, memberId: 'attacker-user', locationId: 'loc-1' } as any;

    // Mock finding NO batch because it belongs to another organization
    mockPrisma.client.batch.findFirst = vi.fn().mockResolvedValue(null);

    await expect(service.completeBatch(ctx, victimBatchId, { actualQuantity: 100 }))
      .rejects.toThrow(NotFoundException);

    expect(mockPrisma.client.batch.findFirst).toHaveBeenCalledWith({
      where: { id: victimBatchId, organizationId: attackerOrgId },
      include: expect.any(Object),
    });
  });

  it('SECURITY FIX: should check organizationId when looking up stock batch for consumption', async () => {
    const attackerOrgId = 'attacker-org';
    const attackerBatchId = 'attacker-batch-id';
    const victimStockBatchId = 'victim-stock-batch-id';

    const ctx = { organizationId: attackerOrgId, memberId: 'attacker-user', locationId: 'loc-1' } as any;

    mockPrisma.client.batch.findFirst = vi.fn().mockResolvedValue({
      id: attackerBatchId,
      organizationId: attackerOrgId,
      batchNumber: 'BAT-ATTACKER',
      recipe: { producesVariantId: 'variant-1', producesVariant: { productId: 'prod-1' } },
    });
    mockPrisma.client.batch.update = vi.fn().mockResolvedValue({ id: attackerBatchId, expiresAt: new Date() });
    mockPrisma.client.stockBatch.create = vi.fn().mockResolvedValue({ id: 'produced-stock-id' });

    // Mock finding NO stockBatch because it belongs to another organization
    mockPrisma.client.stockBatch.findFirst = vi.fn().mockResolvedValue(null);

    const data = {
      actualQuantity: 100,
      ingredientConsumptions: [
        { stockBatchId: victimStockBatchId, quantity: 10 }
      ]
    };

    await expect(service.completeBatch(ctx, attackerBatchId, data))
      .rejects.toThrow(NotFoundException);

    expect(mockPrisma.client.stockBatch.findFirst).toHaveBeenCalledWith({
      where: { id: victimStockBatchId, organizationId: attackerOrgId }
    });
  });

  it('SECURITY FIX: should use organizationId in update calls', async () => {
    const orgId = 'org-1';
    const batchId = 'batch-1';
    const stockBatchId = 'stock-batch-1';

    const ctx = { organizationId: orgId, memberId: 'user-1', locationId: 'loc-1' } as any;

    mockPrisma.client.batch.findFirst = vi.fn().mockResolvedValue({
      id: batchId,
      organizationId: orgId,
      batchNumber: 'BAT-1',
      recipe: { producesVariantId: 'variant-1', producesVariant: { productId: 'prod-1' } },
    });
    mockPrisma.client.batch.update = vi.fn().mockResolvedValue({ id: batchId, expiresAt: new Date() });
    mockPrisma.client.stockBatch.create = vi.fn().mockResolvedValue({ id: 'produced-stock-id' });

    mockPrisma.client.stockBatch.findFirst = vi.fn().mockResolvedValue({
      id: stockBatchId,
      organizationId: orgId,
      currentQuantity: { lt: vi.fn().mockReturnValue(false) }, // Decimal mock
      variantId: 'var-2',
      locationId: 'loc-2',
    });
    mockPrisma.client.stockBatch.updateMany = vi.fn();
    mockPrisma.client.productVariantStock.updateMany = vi.fn();

    const data = {
      actualQuantity: 100,
      ingredientConsumptions: [
        { stockBatchId: stockBatchId, quantity: 10 }
      ]
    };

    await service.completeBatch(ctx, batchId, data);

    expect(mockPrisma.client.stockBatch.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: stockBatchId, organizationId: orgId }
    }));

    expect(mockPrisma.client.productVariantStock.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: orgId })
    }));
  });
});
