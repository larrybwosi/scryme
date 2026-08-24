import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScanUnpackBatchUseCase } from "./scan-unpack-batch.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { StockTransferStatus, MovementType } from "@repo/db";
import { Decimal } from "decimal.js";

describe("ScanUnpackBatchUseCase", () => {
  let useCase: ScanUnpackBatchUseCase;
  let prisma: any;
  let mockUnpackBatchUseCase: any;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      stockBatch: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      stockTransferItem: {
        update: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      productVariantStock: {
        upsert: vi.fn(),
      },
    };
    prisma = {
      client: {
        $transaction: vi.fn(async (cb) => await cb(mockTx)),
      },
    };
    mockUnpackBatchUseCase = {};
    useCase = new ScanUnpackBatchUseCase(
      prisma as any,
      mockUnpackBatchUseCase as any,
    );
  });

  const mockBatch = {
    id: "batch-100",
    organizationId: "org-1",
    variantId: "variant-1",
    locationId: "loc-from",
    batchNumber: "B-100",
    currentQuantity: new Decimal(5),
    purchasePrice: new Decimal(100),
    expiryDate: null,
    qualityCheckStatus: "PASSED",
    supplierId: "sup-1",
    variant: {
      productId: "prod-1",
      baseUnitId: "unit-1",
      baseOrgUnitId: "org-unit-1",
      product: { name: "Test Item" },
      suppliers: [
        { supplierId: "sup-1", unitsPerPackage: new Decimal(12) },
      ],
    },
    transferItems: [
      {
        id: "transfer-item-1",
        stockTransfer: {
          id: "transfer-1",
          transferNumber: "TRF-001",
          status: StockTransferStatus.SHIPPED,
          fromLocationId: "loc-from",
          toLocationId: "loc-to",
        },
      },
    ],
  };

  it("should query stockBatch using findFirst scoped by organizationId (IDOR protection)", async () => {
    mockTx.stockBatch.findFirst.mockResolvedValue(mockBatch);
    mockTx.stockBatch.create.mockResolvedValue({ id: "base-batch-100" });

    const result = await useCase.execute("org-1", "member-1", "batch-100");

    expect(result.success).toBe(true);
    expect(mockTx.stockBatch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch-100", organizationId: "org-1" },
      }),
    );
  });

  it("should throw NotFoundException if stock batch does not exist or belongs to another org", async () => {
    mockTx.stockBatch.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute("org-1", "member-1", "batch-other-org"),
    ).rejects.toThrow(NotFoundException);

    expect(mockTx.stockBatch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch-other-org", organizationId: "org-1" },
      }),
    );
  });

  it("should throw BadRequestException if batch is not associated with an active transfer", async () => {
    const batchNoTransfer = {
      ...mockBatch,
      transferItems: [],
    };
    mockTx.stockBatch.findFirst.mockResolvedValue(batchNoTransfer);

    await expect(
      useCase.execute("org-1", "member-1", "batch-100"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should successfully process scan and unpack batch", async () => {
    mockTx.stockBatch.findFirst.mockResolvedValue(mockBatch);
    mockTx.stockBatch.create.mockResolvedValue({ id: "base-batch-100" });

    const result = await useCase.execute("org-1", "member-1", "batch-100");

    expect(result.success).toBe(true);
    expect(result.transferNumber).toBe("TRF-001");
    expect(result.unpackedQuantity).toBe(5);
    expect(result.receivedQuantity).toBe(60); // 5 * 12
    expect(result.baseBatchId).toBe("base-batch-100");

    expect(mockTx.stockTransferItem.update).toHaveBeenCalledWith({
      where: { id: "transfer-item-1" },
      data: { receivedQuantity: { increment: expect.any(Object) } },
    });

    expect(mockTx.stockBatch.update).toHaveBeenCalledWith({
      where: { id: "batch-100" },
      data: { currentQuantity: { decrement: 5 } },
    });

    expect(mockTx.productVariantStock.upsert).toHaveBeenCalledWith({
      where: {
        variantId_locationId: {
          variantId: "variant-1",
          locationId: "loc-to",
        },
      },
      update: {
        currentStock: { increment: expect.any(Object) },
        availableStock: { increment: expect.any(Object) },
      },
      create: expect.objectContaining({
        organizationId: "org-1",
        productId: "prod-1",
        variantId: "variant-1",
        locationId: "loc-to",
      }),
    });
  });
});
