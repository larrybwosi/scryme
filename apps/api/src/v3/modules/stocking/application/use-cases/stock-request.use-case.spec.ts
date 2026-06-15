import {vi, describe, it, expect, beforeEach} from "vitest";
import {StockRequestUseCase} from "./stock-request.use-case";
import {
  StockRequestStatus,
  StockTransferStatus,
  PurchaseStatus,
} from "@repo/db";

vi.mock("@repo/db", async importOriginal => ({
  ...((await importOriginal()) as any),
  StockRequestStatus: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    FULFILLED: "FULFILLED",
    PARTIALLY_FULFILLED: "PARTIALLY_FULFILLED",
  },
  StockTransferStatus: {
    PENDING_APPROVAL: "PENDING_APPROVAL",
  },
  PurchaseStatus: {
    ORDERED: "ORDERED",
  },
}));

vi.mock("@repo/windmill/server", () => ({
  emitPurchaseApprovalRequested: vi.fn().mockResolvedValue({}),
  emitStockTransferCreated: vi.fn().mockResolvedValue({}),
}));

describe("StockRequestUseCase", () => {
  let stockRequestUseCase: StockRequestUseCase;
  let prisma: any;
  let mockTx: any;

  const mockOrgId = "org-1";
  const mockMemberId = "member-1";
  const mockRequestId = "req-1";

  beforeEach(() => {
    mockTx = {
      stockRequest: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockTransfer: {
        create: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
      },
      stockRequestItem: {
        updateMany: vi.fn(),
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async callback => await callback(mockTx)),
        stockRequest: mockTx.stockRequest,
      },
    };

    stockRequestUseCase = new StockRequestUseCase(prisma);
  });

  it("should approve a stock request", async () => {
    mockTx.stockRequest.findUnique.mockResolvedValue({
      id: mockRequestId,
      organizationId: mockOrgId,
      status: StockRequestStatus.PENDING,
    });

    await stockRequestUseCase.approve(mockOrgId, mockMemberId, mockRequestId);

    expect(mockTx.stockRequest.update).toHaveBeenCalledWith({
      where: {id: mockRequestId},
      data: expect.objectContaining({
        status: StockRequestStatus.APPROVED,
        approvedById: mockMemberId,
      }),
    });
  });

  it("should fulfill from transfer", async () => {
    mockTx.stockRequest.findUnique.mockResolvedValue({
      id: mockRequestId,
      requestNumber: "REQ-001",
      organizationId: mockOrgId,
      status: StockRequestStatus.APPROVED,
      toLocationId: "loc-to",
      items: [{variantId: "v1", unitCostAtRequest: 100}],
    });

    const dto = {
      fromLocationId: "loc-from",
      items: [{variantId: "v1", requestedQuantity: 5}],
    };

    await stockRequestUseCase.fulfillFromTransfer(
      mockOrgId,
      mockMemberId,
      mockRequestId,
      dto,
    );

    expect(mockTx.stockTransfer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromLocationId: "loc-from",
          toLocationId: "loc-to",
          stockRequestId: mockRequestId,
        }),
      }),
    );

    expect(mockTx.stockRequestItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {stockRequestId: mockRequestId, variantId: "v1"},
        data: {allocatedQuantity: {increment: 5}},
      }),
    );
  });

  it("should fulfill from purchase", async () => {
    mockTx.stockRequest.findUnique.mockResolvedValue({
      id: mockRequestId,
      requestNumber: "REQ-001",
      organizationId: mockOrgId,
      status: StockRequestStatus.APPROVED,
      items: [{variantId: "v1", unitCostAtRequest: 100}],
    });

    const dto = {
      supplierId: "sup-1",
      items: [{variantId: "v1", orderedQuantity: 10, unitCost: 90}],
    };

    await stockRequestUseCase.fulfillFromPurchase(
      mockOrgId,
      mockMemberId,
      mockRequestId,
      dto,
    );

    expect(mockTx.purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplierId: "sup-1",
          stockRequestId: mockRequestId,
          status: PurchaseStatus.ORDERED,
        }),
      }),
    );

    expect(mockTx.stockRequestItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {stockRequestId: mockRequestId, variantId: "v1"},
        data: {allocatedQuantity: {increment: 10}},
      }),
    );
  });
});
