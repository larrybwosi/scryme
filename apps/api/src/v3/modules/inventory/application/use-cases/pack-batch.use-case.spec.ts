import { PackBatchUseCase } from './pack-batch.use-case';
import { Decimal } from 'decimal.js';

describe('PackBatchUseCase', () => {
  let useCase: PackBatchUseCase;
  let prisma: any;
  let movementService: any;

  beforeEach(() => {
    prisma = {
      client: {
        $transaction: vi.fn((cb) => cb(prisma.client)),
        stockBatch: {
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
      },
    };
    movementService = {
      recordMovement: vi.fn(),
    };
    useCase = new PackBatchUseCase(prisma as any, movementService as any);
  });

  it('should pack a batch successfully', async () => {
    const mockBaseBatch = {
      id: 'base-1',
      organizationId: 'org-1',
      variantId: 'var-1',
      locationId: 'loc-1',
      currentQuantity: new Decimal(24),
      purchasePrice: new Decimal(10),
      batchNumber: 'BASE001',
      receivedDate: new Date(),
      expiryDate: null,
      qualityCheckStatus: 'PASSED',
      supplierId: 'sup-1',
    };

    prisma.client.stockBatch.findUnique.mockResolvedValue(mockBaseBatch);
    prisma.client.stockBatch.create.mockResolvedValue({ id: 'bulk-1' });

    const result = await useCase.execute('org-1', 'mem-1', {
      batchId: 'base-1',
      quantityToPack: 24,
      unitsPerPackage: 12,
    });

    expect(result.success).toBe(true);
    expect(result.bulkBatchId).toBe('bulk-1');
    expect(result.receivedBulkQuantity).toBe(2);

    expect(prisma.client.stockBatch.update).toHaveBeenCalledWith({
      where: { id: 'base-1' },
      data: { currentQuantity: { decrement: 24 } },
    });

    expect(prisma.client.stockBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        initialQuantity: new Decimal(2),
        currentQuantity: new Decimal(2),
        purchasePrice: new Decimal(120), // 10 * 12
      }),
    });
  });

  it('should throw error if insufficient quantity', async () => {
    const mockBaseBatch = {
      id: 'base-1',
      organizationId: 'org-1',
      currentQuantity: new Decimal(10),
    };

    prisma.client.stockBatch.findUnique.mockResolvedValue(mockBaseBatch);

    await expect(useCase.execute('org-1', 'mem-1', {
      batchId: 'base-1',
      quantityToPack: 24,
      unitsPerPackage: 12,
    })).rejects.toThrow('Insufficient quantity');
  });

  it('should throw error if not packing whole bulk units', async () => {
    const mockBaseBatch = {
      id: 'base-1',
      organizationId: 'org-1',
      currentQuantity: new Decimal(24),
    };

    prisma.client.stockBatch.findUnique.mockResolvedValue(mockBaseBatch);

    await expect(useCase.execute('org-1', 'mem-1', {
      batchId: 'base-1',
      quantityToPack: 10,
      unitsPerPackage: 12,
    })).rejects.toThrow('must result in whole bulk units');
  });
});
