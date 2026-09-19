import { describe, it, expect, beforeEach, vi } from "vitest";
import { PurchaseOrderUseCase } from "./purchase-order.use-case";
import { StockTransferUseCase } from "./stock-transfer.use-case";
import { PurchaseStatus, StockTransferStatus } from "@repo/db";

describe("Stock Reception and Batch Traceability Use Cases", () => {
  let purchaseOrderUseCase: PurchaseOrderUseCase;
  let stockTransferUseCase: StockTransferUseCase;
  let prismaMock: any;
  let inventoryMovementServiceMock: any;
  let pricingManagementServiceMock: any;
  let accountingServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      client: {
        supplier: {
          findFirst: vi.fn(),
        },
        purchase: {
          findFirst: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        stockReceipt: {
          create: vi.fn().mockResolvedValue({ id: "receipt_123" }),
        },
        stockBatch: {
          create: vi.fn().mockResolvedValue({ id: "batch_123" }),
          update: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        purchaseItem: {
          update: vi.fn(),
        },
        productVariantStock: {
          upsert: vi.fn(),
          update: vi.fn(),
        },
        stockTransfer: {
          findFirst: vi.fn(),
          update: vi.fn(),
        },
        stockTransferItem: {
          update: vi.fn(),
        },
        inventoryLocation: {
          count: vi.fn().mockResolvedValue(2),
        },
        productVariant: {
          count: vi.fn().mockResolvedValue(1),
        },
        $transaction: vi.fn().mockImplementation(async (cb) => cb(prismaMock.client)),
      },
    };

    inventoryMovementServiceMock = {
      recordMovement: vi.fn().mockResolvedValue({ id: "movement_123" }),
    };

    pricingManagementServiceMock = {
      handleCostChange: vi.fn().mockResolvedValue(true),
    };

    accountingServiceMock = {
      postPurchaseToLedger: vi.fn().mockResolvedValue(true),
    };

    purchaseOrderUseCase = new PurchaseOrderUseCase(
      prismaMock as any,
      inventoryMovementServiceMock as any,
      pricingManagementServiceMock as any,
      accountingServiceMock as any,
    );

    stockTransferUseCase = new StockTransferUseCase(
      prismaMock as any,
      inventoryMovementServiceMock as any,
    );
  });

  it("should receive a purchase order delivery with batch numbers, supplier batches, and expiry dates", async () => {
    const mockPurchase = {
      id: "po_123",
      organizationId: "org_1",
      supplierId: "supplier_1",
      purchaseNumber: "PO-2025-0001",
      status: PurchaseStatus.ORDERED,
      items: [
        {
          id: "item_1",
          variantId: "var_1",
          orderedQuantity: 100,
          receivedQuantity: 0,
          unitCost: 25.0,
          variant: { id: "var_1", productId: "prod_1" },
        },
      ],
    };

    prismaMock.client.purchase.findFirst.mockResolvedValue(mockPurchase);

    const result = await purchaseOrderUseCase.receive("org_1", "member_1", "po_123", {
      locationId: "loc_1",
      notes: "Delivered in full with certificate",
      items: [
        {
          purchaseItemId: "item_1",
          batches: [
            {
              quantity: 100,
              batchNumber: "BAT-SUP-9988",
              supplierBatchNumber: "LOT-ABC-123",
              expiryDate: "2026-12-31",
            },
          ],
        },
      ],
    });

    expect(result).toBeDefined();
    expect(prismaMock.client.stockBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_1",
        variantId: "var_1",
        purchaseItemId: "item_1",
        locationId: "loc_1",
        batchNumber: "BAT-SUP-9988",
        supplierBatchNumber: "LOT-ABC-123",
        initialQuantity: 100,
        currentQuantity: 100,
        supplierId: "supplier_1",
      }),
    });
    expect(inventoryMovementServiceMock.recordMovement).toHaveBeenCalled();
  });

  it("should receive a stock transfer and create stock batches at destination location", async () => {
    const mockTransfer = {
      id: "transfer_123",
      organizationId: "org_1",
      transferNumber: "TR-1001",
      status: StockTransferStatus.SHIPPED,
      fromLocationId: "loc_1",
      toLocationId: "loc_2",
      items: [
        {
          id: "t_item_1",
          variantId: "var_1",
          requestedQuantity: 50,
          shippedQuantity: 50,
          receivedQuantity: 0,
          unitCost: 15.0,
          variant: { id: "var_1", productId: "prod_1" },
        },
      ],
    };

    prismaMock.client.stockTransfer.findFirst.mockResolvedValue(mockTransfer);
    prismaMock.client.stockTransfer.update.mockResolvedValue({
      ...mockTransfer,
      status: StockTransferStatus.COMPLETED,
      receivedDate: new Date(),
      receivedBy: { user: { name: "Tester" } },
    });

    const result = await stockTransferUseCase.receive("org_1", "member_1", "transfer_123", {
      items: [
        {
          transferItemId: "t_item_1",
          receivedQuantity: 50,
        },
      ],
    });

    expect(result).toBeDefined();
    expect(prismaMock.client.stockBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_1",
        variantId: "var_1",
        locationId: "loc_2",
        initialQuantity: 50,
        currentQuantity: 50,
      }),
    });
  });
});
