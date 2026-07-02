import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@repo/windmill/server", () => ({
  emitPurchaseApprovalRequested: vi.fn().mockResolvedValue({}),
  emitStockTransferCreated: vi.fn().mockResolvedValue({}),
  emitStockTransferShipped: vi.fn().mockResolvedValue({}),
  emitStockTransferReceived: vi.fn().mockResolvedValue({}),
}));

vi.mock("@repo/db", async (importOriginal) => ({
  ...((await importOriginal()) as any),
  PurchaseStatus: {
    DRAFT: "DRAFT",
    ORDERED: "ORDERED",
    PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
    RECEIVED: "RECEIVED",
    BILLED: "BILLED",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    PAID: "PAID",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },
  StockTransferStatus: {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    SHIPPED: "SHIPPED",
    IN_TRANSIT: "IN_TRANSIT",
    RECEIVED: "RECEIVED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED",
  },
  QualityCheckStatus: {
    PENDING: "PENDING",
    PASSED: "PASSED",
    FAILED: "FAILED",
  },
  MovementType: {
    PURCHASE_RECEIPT: "PURCHASE_RECEIPT",
    SALE: "SALE",
    ADJUSTMENT_IN: "ADJUSTMENT_IN",
    ADJUSTMENT_OUT: "ADJUSTMENT_OUT",
    TRANSFER: "TRANSFER",
    CUSTOMER_RETURN: "CUSTOMER_RETURN",
    SUPPLIER_RETURN: "SUPPLIER_RETURN",
    INITIAL_STOCK: "INITIAL_STOCK",
    PRODUCTION_IN: "PRODUCTION_IN",
    PRODUCTION_OUT: "PRODUCTION_OUT",
    QUALITY_REJECTION: "QUALITY_REJECTION",
  },
  SerialNumberStatus: {
    IN_STOCK: "IN_STOCK",
    SOLD: "SOLD",
    TRANSFERRED: "TRANSFERRED",
    RETURNED: "RETURNED",
    DAMAGED: "DAMAGED",
    LOST: "LOST",
    QUARANTINED: "QUARANTINED",
  },
  StockRequestPriority: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT",
  },
  StockRequestStatus: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    FULFILLED: "FULFILLED",
    PARTIALLY_FULFILLED: "PARTIALLY_FULFILLED",
  },
}));

import { PurchaseOrderUseCase } from "./purchase-order.use-case";
import { StockTransferUseCase } from "./stock-transfer.use-case";
import { PurchaseStatus, StockTransferStatus, MovementType } from "@repo/db";

describe("Stocking Flow Verification", () => {
  let purchaseOrderUseCase: PurchaseOrderUseCase;
  let stockTransferUseCase: StockTransferUseCase;
  let prisma: any;
  let inventoryMovementService: any;
  let mockTx: any;

  const mockOrgId = "org-1";
  const mockMemberId = "member-1";
  const mockSupplierId = "supplier-1";
  const mockLocationA = "loc-a";
  const mockLocationB = "loc-b";

  beforeEach(() => {
    inventoryMovementService = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };

    // Mock Prisma Client Transaction Object
    mockTx = {
      purchase: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockReceipt: {
        create: vi.fn(),
      },
      stockBatch: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      serialNumber: {
        createMany: vi.fn(),
        updateMany: vi.fn(),
      },
      qCResult: {
        create: vi.fn(),
      },
      productVariantStock: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      purchaseItem: {
        update: vi.fn(),
      },
      stockTransfer: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockTransferItem: {
        update: vi.fn(),
      },
      stockRequestItem: {
        updateMany: vi.fn(),
        findMany: vi.fn(),
      },
      stockRequest: {
        update: vi.fn(),
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async (callback) => {
          if (typeof callback === "function") {
            return await callback(mockTx);
          }
          return [];
        }),
        purchase: mockTx.purchase,
        stockTransfer: mockTx.stockTransfer,
        stockRequestItem: mockTx.stockRequestItem,
        stockRequest: mockTx.stockRequest,
      },
    };

    const pricingManagementService = {
      handleCostChange: vi.fn().mockResolvedValue({}),
    } as any;

    purchaseOrderUseCase = new PurchaseOrderUseCase(
      prisma,
      inventoryMovementService,
      pricingManagementService,
    );
    stockTransferUseCase = new StockTransferUseCase(
      prisma,
      inventoryMovementService,
    );
  });

  it("should verify the full flow: PO -> Receipt (QC) -> Transfer", async () => {
    // 1. Create PO
    const createPoDto = {
      supplierId: mockSupplierId,
      items: [
        { variantId: "v1", orderedQuantity: 10, unitCost: 100 },
        { variantId: "v2", orderedQuantity: 5, unitCost: 200 },
      ],
    };

    mockTx.purchase.create.mockImplementation(({ data }: any) => ({
      id: "po-1",
      ...data,
      purchaseNumber: "PO-1",
      totalAmount: 2000,
      currency: "KES",
      items: data.items.create.map((item: any, index: number) => ({
        id: `poi-${index}`,
        ...item,
      })),
      member: { user: { name: "Test User" } },
    }));

    const po = await purchaseOrderUseCase.create(
      mockOrgId,
      mockMemberId,
      createPoDto,
    );
    expect(po.id).toBe("po-1");

    // 2. Receive PO with QC
    const receivePoDto = {
      locationId: mockLocationA,
      items: [
        {
          purchaseItemId: "poi-0",
          batches: [
            {
              quantity: 10,
              batchNumber: "batch-v1",
              qcResults: {
                templateId: "t1",
                data: {},
                status: "PASSED" as any,
              },
            },
          ],
        },
        {
          purchaseItemId: "poi-1",
          batches: [
            {
              quantity: 5,
              batchNumber: "batch-v2",
              qcResults: {
                templateId: "t1",
                data: {},
                status: "FAILED" as any,
              },
            },
          ],
        },
      ],
    };

    const mockPoWithItems = {
      id: "po-1",
      organizationId: mockOrgId,
      status: PurchaseStatus.ORDERED,
      supplierId: mockSupplierId,
      purchaseNumber: "PO-123",
      items: [
        {
          id: "poi-0",
          variantId: "v1",
          unitCost: 100,
          variant: { productId: "p1" },
        },
        {
          id: "poi-1",
          variantId: "v2",
          unitCost: 200,
          variant: { productId: "p2" },
        },
      ],
    };

    mockTx.purchase.findUnique.mockResolvedValue(mockPoWithItems);
    mockTx.stockReceipt.create.mockResolvedValue({ id: "rec-1" });
    mockTx.stockBatch.create.mockImplementation(({ data }: any) => ({
      id: `batch-${data.variantId}`,
      ...data,
    }));
    mockTx.purchase.update.mockResolvedValue({ id: "po-1" });

    await purchaseOrderUseCase.receive(
      mockOrgId,
      mockMemberId,
      "po-1",
      receivePoDto,
    );

    expect(mockTx.qCResult.create).toHaveBeenCalledTimes(2);

    // 3. Stock Transfer (Full Workflow)
    const createTransferDto = {
      fromLocationId: mockLocationA,
      toLocationId: mockLocationB,
      items: [{ variantId: "v1", requestedQuantity: 5 }],
    };

    mockTx.stockTransfer.create.mockImplementation(({ data }: any) => ({
      id: "tr-1",
      transferNumber: "TR-1",
      fromLocationId: mockLocationA,
      toLocationId: mockLocationB,
      fromLocation: { name: "Loc A" },
      toLocation: { name: "Loc B" },
      status: StockTransferStatus.PENDING_APPROVAL,
      ...data,
      items: data.items.create.map((item: any, index: number) => ({
        id: `tri-${index}`,
        ...item,
        variant: { product: { name: "Prod" }, name: "Var" },
      })),
    }));

    const transfer = await stockTransferUseCase.create(
      mockOrgId,
      mockMemberId,
      createTransferDto,
    );
    expect(transfer.status).toBe(StockTransferStatus.PENDING_APPROVAL);

    mockTx.stockTransfer.findUnique.mockResolvedValue({
      id: "tr-1",
      ...createTransferDto,
      status: StockTransferStatus.PENDING_APPROVAL,
      items: [{ id: "tri-1", variantId: "v1", requestedQuantity: 5 }],
    });
    mockTx.productVariantStock.findMany.mockResolvedValue([
      { variantId: "v1", availableStock: 10 },
    ]);
    mockTx.stockTransfer.update.mockImplementation(({ data }: any) => ({
      id: "tr-1",
      transferNumber: "TR-1",
      shippedDate: new Date(),
      receivedDate: new Date(),
      receivedBy: { user: { name: "Test" } },
      ...data,
    }));

    await stockTransferUseCase.approve(mockOrgId, mockMemberId, "tr-1");

    const shipDto = {
      items: [{ transferItemId: "tri-1", shippedQuantity: 5 }],
    };
    mockTx.stockTransfer.findUnique.mockResolvedValue({
      id: "tr-1",
      transferNumber: "TR-1",
      fromLocationId: mockLocationA,
      status: StockTransferStatus.APPROVED,
      items: [
        {
          id: "tri-1",
          variantId: "v1",
          requestedQuantity: 5,
          variant: { sku: "SKU-V1" },
        },
      ],
    });
    mockTx.stockBatch.findMany.mockResolvedValue([
      { id: "batch-v1", variantId: "v1", currentQuantity: 10 },
    ]);

    await stockTransferUseCase.ship(mockOrgId, mockMemberId, "tr-1", shipDto);

    const receiveTransferDto = {
      items: [{ transferItemId: "tri-1", receivedQuantity: 5 }],
    };
    mockTx.stockTransfer.findUnique.mockResolvedValue({
      id: "tr-1",
      transferNumber: "TR-1",
      toLocationId: mockLocationB,
      status: StockTransferStatus.SHIPPED,
      items: [
        {
          id: "tri-1",
          variantId: "v1",
          requestedQuantity: 5,
          unitCost: 100,
          variant: { productId: "p1" },
        },
      ],
    });

    await stockTransferUseCase.receive(
      mockOrgId,
      mockMemberId,
      "tr-1",
      receiveTransferDto,
    );

    expect(inventoryMovementService.recordMovement).toHaveBeenCalledTimes(4);
  });
});
