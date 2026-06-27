import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '@/prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('InventoryService adjustStock IDOR', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
      productVariantStock: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('VULNERABILITY REPRODUCTION: should adjust stock of another organization if organizationId filter is missing', async () => {
    const attackerOrgId = 'attacker-org';
    const victimOrgId = 'victim-org';
    const victimVariantId = 'victim-variant-id';
    const victimLocationId = 'victim-location-id';
    const victimStockId = 'victim-stock-id';

    const adjustData = {
      organizationId: attackerOrgId,
      variantId: victimVariantId,
      locationId: victimLocationId,
      quantity: 10,
      reason: 'sale',
      userId: 'attacker-user',
    };

    // Mock finding a stock record that belongs to the victim organization
    mockPrisma.client.productVariantStock.findFirst.mockResolvedValue({
      id: victimStockId,
      organizationId: victimOrgId,
      availableStock: 5,
    });

    mockPrisma.client.stockMovement.create.mockResolvedValue({ id: 'movement-id' });

    await service.adjustStock(adjustData);

    // After fix: findFirst MUST be called WITH organizationId filter
    expect(mockPrisma.client.productVariantStock.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: attackerOrgId,
        variantId: victimVariantId,
        locationId: victimLocationId,
      }
    });

    // After fix: update MUST be called WITH organizationId filter
    expect(mockPrisma.client.productVariantStock.update).toHaveBeenCalledWith({
      where: { id: victimStockId, organizationId: attackerOrgId },
      data: expect.objectContaining({
        availableStock: { increment: 10 },
      })
    });
  });
});
