import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryIntegrityService } from './inventory-integrity.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('InventoryIntegrityService', () => {
  let service: InventoryIntegrityService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        productVariant: {
          findMany: vi.fn(),
        },
        productVariantStock: {
          findMany: vi.fn(),
        },
        stockBatch: {
          findMany: vi.fn(),
        },
      },
    };
    service = new InventoryIntegrityService(prisma as unknown as PrismaService);
  });

  it('should identify mismatches between stocks and batches', async () => {
    const orgId = 'org-1';
    const variantId = 'var-1';
    const locationId = 'loc-1';

    // Mock variants
    prisma.client.productVariant.findMany
      .mockResolvedValueOnce([{ id: variantId }])
      .mockResolvedValueOnce([]); // Stop the while loop

    // Mock stocks: 10 units in stock summary
    prisma.client.productVariantStock.findMany.mockResolvedValue([
      {
        variantId,
        locationId,
        currentStock: 10,
      },
    ]);

    // Mock batches: only 8 units total in batches
    prisma.client.stockBatch.findMany.mockResolvedValue([
      {
        variantId,
        locationId,
        currentQuantity: 5,
      },
      {
        variantId,
        locationId,
        currentQuantity: 3,
      },
    ]);

    const result = await service.verifyOrganizationIntegrity(orgId);

    expect(result.status).toBe('UNHEALTHY');
    expect(result.issuesCount).toBe(1);
    expect(result.issues[0]).toMatchObject({
      type: 'STOCK_BATCH_MISMATCH',
      variantId,
      locationId,
      stockQty: 10,
      batchTotalQty: 8,
    });

    // Verify bulk queries were used
    expect(prisma.client.productVariantStock.findMany).toHaveBeenCalledWith({
      where: { variantId: { in: [variantId] } },
    });
    expect(prisma.client.stockBatch.findMany).toHaveBeenCalledWith({
      where: {
        variantId: { in: [variantId] },
        currentQuantity: { gt: 0 },
      },
    });
  });

  it('should return HEALTHY when everything matches', async () => {
    const orgId = 'org-1';
    const variantId = 'var-1';
    const locationId = 'loc-1';

    prisma.client.productVariant.findMany
      .mockResolvedValueOnce([{ id: variantId }])
      .mockResolvedValueOnce([]);

    prisma.client.productVariantStock.findMany.mockResolvedValue([
      {
        variantId,
        locationId,
        currentStock: 10,
      },
    ]);

    prisma.client.stockBatch.findMany.mockResolvedValue([
      {
        variantId,
        locationId,
        currentQuantity: 10,
      },
    ]);

    const result = await service.verifyOrganizationIntegrity(orgId);

    expect(result.status).toBe('HEALTHY');
    expect(result.issuesCount).toBe(0);
  });
});
