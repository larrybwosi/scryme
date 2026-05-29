import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PurchaseOrderUseCase } from './purchase-order.use-case';
import { StockTransferUseCase } from './stock-transfer.use-case';
import { StockRequestUseCase } from './stock-request.use-case';
import { PurchaseStatus, StockTransferStatus, MovementType, QualityCheckStatus, StockRequestStatus } from '@repo/db';

vi.mock('@repo/windmill/server', () => ({
  emitPurchaseApprovalRequested: vi.fn().mockResolvedValue({}),
  emitStockTransferCreated: vi.fn().mockResolvedValue({}),
  emitStockTransferShipped: vi.fn().mockResolvedValue({}),
  emitStockTransferReceived: vi.fn().mockResolvedValue({}),
}));

describe('Stocking Edge Cases', () => {
  let purchaseOrderUseCase: PurchaseOrderUseCase;
  let stockTransferUseCase: StockTransferUseCase;
  let stockRequestUseCase: StockRequestUseCase;
  let prisma: any;
  let inventoryMovementService: any;
  let pricingManagementService: any;
  let mockTx: any;

  const mockOrgId = 'org-1';
  const mockMemberId = 'member-1';
  const mockLocationA = 'loc-a';
  const mockLocationB = 'loc-b';

  beforeEach(() => {
    inventoryMovementService = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };
    pricingManagementService = {
      updateVariantPriceFromPurchase: vi.fn().mockResolvedValue({}),
      handleCostChange: vi.fn().mockResolvedValue({}),
    };

    mockTx = {
      purchase: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      stockReceipt: {
        create: vi.fn(),
      },
      stockBatch: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      productVariantStock: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      purchaseItem: {
        update: vi.fn(),
      },
      stockTransfer: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      stockTransferItem: {
        update: vi.fn(),
      },
      qcResult: {
        create: vi.fn(),
      },
      serialNumber: {
        updateMany: vi.fn(),
        createMany: vi.fn(),
      },
      stockRequest: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockRequestItem: {
        updateMany: vi.fn(),
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async callback => await callback(mockTx)),
        stockRequest: mockTx.stockRequest,
        stockTransfer: mockTx.stockTransfer,
        purchase: mockTx.purchase,
      },
    };

    purchaseOrderUseCase = new PurchaseOrderUseCase(prisma, inventoryMovementService, pricingManagementService);
    stockTransferUseCase = new StockTransferUseCase(prisma, inventoryMovementService);
    stockRequestUseCase = new StockRequestUseCase(prisma);
  });

  it('should handle partial shipment in stock transfer', async () => {
    const transferId = 'tr-partial';
    mockTx.stockTransfer.findUnique.mockResolvedValue({
      id: transferId,
      organizationId: mockOrgId,
      status: StockTransferStatus.APPROVED,
      fromLocationId: mockLocationA,
      transferNumber: 'TR-PARTIAL',
      items: [{ id: 'item-1', variantId: 'v1', requestedQuantity: 10, variant: { sku: 'SKU-V1' } }],
    });

    mockTx.stockBatch.findMany.mockResolvedValue([{ id: 'batch-1', currentQuantity: 10 }]);

    mockTx.stockTransfer.update.mockResolvedValue({
      id: transferId,
      transferNumber: 'TR-PARTIAL',
      shippedDate: new Date(),
    });

    const shipDto = {
      items: [{ transferItemId: 'item-1', shippedQuantity: 4 }], // Shipping only 4 out of 10
    };

    await stockTransferUseCase.ship(mockOrgId, mockMemberId, transferId, shipDto);

    expect(mockTx.productVariantStock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStock: { decrement: 4 },
          reservedStock: { decrement: 10 },
        }),
      })
    );

    expect(mockTx.stockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentQuantity: { decrement: 4 } },
      })
    );
  });

  it('should fail shipment if insufficient stock in batches', async () => {
    const transferId = 'tr-fail';
    mockTx.stockTransfer.findUnique.mockResolvedValue({
      id: transferId,
      organizationId: mockOrgId,
      status: StockTransferStatus.APPROVED,
      fromLocationId: mockLocationA,
      transferNumber: 'TR-FAIL',
      items: [{ id: 'item-1', variantId: 'v1', requestedQuantity: 10, variant: { sku: 'SKU-V1' } }],
    });

    mockTx.stockBatch.findMany.mockResolvedValue([
      { id: 'batch-1', currentQuantity: 2 }, // Only 2 available in batch
    ]);

    const shipDto = {
      items: [{ transferItemId: 'item-1', shippedQuantity: 5 }],
    };

    await expect(stockTransferUseCase.ship(mockOrgId, mockMemberId, transferId, shipDto)).rejects.toThrow(
      'Insufficient stock in specified batches'
    );
  });

  it('should handle QC failure during PO receipt (Quarantine)', async () => {
    const purchaseId = 'po-qc-fail';
    mockTx.purchase.findUnique.mockResolvedValue({
      id: purchaseId,
      organizationId: mockOrgId,
      status: PurchaseStatus.ORDERED,
      items: [{ id: 'poi-1', variantId: 'v1', unitCost: 100, variant: { productId: 'p1' } }],
    });

    const receiveDto = {
      locationId: mockLocationA,
      items: [
        {
          purchaseItemId: 'poi-1',
          batches: [
            {
              quantity: 10,
              batchNumber: 'B-FAILED',
              qcResults: { templateId: 't1', data: {}, status: QualityCheckStatus.FAILED as any },
            },
          ],
        },
      ],
    };

    mockTx.stockBatch.create.mockResolvedValue({ id: 'b-1', variantId: 'v1' });
    mockTx.purchase.update.mockResolvedValue({ id: purchaseId, items: [] });

    await purchaseOrderUseCase.receive(mockOrgId, mockMemberId, purchaseId, receiveDto);

    expect(mockTx.stockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'b-1' },
        data: {
          isQuarantined: true,
          quarantineReason: 'Failed QC on receipt',
        },
      })
    );
  });

  it('should handle partial receipt of stock transfer', async () => {
    const transferId = 'tr-partial-rec';
    mockTx.stockTransfer.findUnique.mockResolvedValue({
      id: transferId,
      organizationId: mockOrgId,
      status: StockTransferStatus.SHIPPED,
      toLocationId: mockLocationB,
      transferNumber: 'TR-REC-1',
      items: [{ id: 'item-1', variantId: 'v1', requestedQuantity: 10, unitCost: 100, variant: { productId: 'p1' } }],
    });

    const receiveDto = {
      items: [{ transferItemId: 'item-1', receivedQuantity: 8 }], // Received 8 out of 10
    };

    mockTx.stockBatch.create.mockResolvedValue({ id: 'new-batch-v1' });
    mockTx.stockTransfer.update.mockResolvedValue({
      id: transferId,
      transferNumber: 'TR-REC-1',
      receivedDate: new Date(),
    });

    await stockTransferUseCase.receive(mockOrgId, mockMemberId, transferId, receiveDto);

    expect(mockTx.productVariantStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { variantId_locationId: { variantId: 'v1', locationId: mockLocationB } },
        update: {
          currentStock: { increment: 8 },
          availableStock: { increment: 8 },
        },
      })
    );
  });

  it('should handle stock request fulfillment via transfer', async () => {
    const requestId = 'req-1';
    mockTx.stockRequest.findUnique.mockResolvedValue({
      id: requestId,
      organizationId: mockOrgId,
      status: StockRequestStatus.APPROVED,
      toLocationId: mockLocationB,
      requestNumber: 'SR-1',
      items: [{ variantId: 'v1', unitCostAtRequest: 100 }],
    });

    const fulfillDto = {
      fromLocationId: mockLocationA,
      items: [{ variantId: 'v1', requestedQuantity: 5 }],
    };

    mockTx.stockTransfer.create.mockResolvedValue({ id: 'tr-from-req' });

    await stockRequestUseCase.fulfillFromTransfer(mockOrgId, mockMemberId, requestId, fulfillDto);

    expect(mockTx.stockTransfer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromLocationId: mockLocationA,
          toLocationId: mockLocationB,
          stockRequestId: requestId,
        }),
      })
    );

    expect(mockTx.stockRequestItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stockRequestId: requestId, variantId: 'v1' },
        data: { allocatedQuantity: { increment: 5 } },
      })
    );
  });
});
