import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScanUnpackBatchUseCase } from "./scan-unpack-batch.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { StockTransferStatus, MovementType } from "@repo/db";
import { Decimal } from "decimal.js";

// Mock PrismaService to avoid @repo/db issues during testing
vi.mock("src/prisma/prisma.service", () => {
  return {
    PrismaService: vi.fn().mockImplementation(() => ({
      client: {
        $transaction: vi.fn(async (cb) => await cb({})),
      },
    })),
  };
});

describe("ScanUnpackBatchUseCase", () => {
  let useCase: ScanUnpackBatchUseCase;
  let prisma: any;
  let unpackBatchUseCase: any;
  let mockTx: any;

  const mockOrgId = "org-1";
  const mockMemberId = "member-1";
  const mockBatchId = "batch-100";

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

    unpackBatchUseCase = {};

    useCase = new ScanUnpackBatchUseCase(prisma as any, unpackBatchUseCase as any);
  });

  const mockBatch = {
    id: mockBatchId,
    organizationId: mockOrgId,
    variantId: "variant-1",
    locationId: "loc-from",
    batchNumber: "BATCH-SCAN-1",
    currentQuantity: new Decimal(5),
    purchasePrice: new Decimal(1200),
    supplierId: "supplier-1",
    qualityCheckStatus: "PASSED",
    expiryDate: new Date("2030-01-01"),
    variant: {
      productId: "prod-1",
      baseUnitId: "unit-piece",
      baseOrgUnitId: "org-unit-piece",
      product: { name: "Sample Product" },
      suppliers: [
        { supplierId: "supplier-1", unitsPerPackage: new Decimal(24) },
      ],
    },
    transferItems: [
      {
        id: "transfer-item-1",
        stockTransfer: {
          id: "transfer-1",
          transferNumber: "TR-1001",
          status: StockTransferStatus.SHIPPED,
          fromLocationId: "loc-from",
          toLocationId: "loc-to",
        },
      },
    ],
  };

  it("should scan and auto-unpack batch successfully using findFirst for tenant scoping", async () => {
    mockTx.stockBatch.findFirst.mockResolvedValue(mockBatch);
    mockTx.stockBatch.create.mockResolvedValue({ id: "base-batch-scan" });

    const result = await useCase.execute(mockOrgId, mockMemberId, mockBatchId);

    expect(result.success).toBe(true);
    expect(result.transferNumber).toBe("TR-1001");
    expect(result.unpackedQuantity).toBe(5);
    expect(result.receivedQuantity).toBe(120); // 5 * 24

    // Verify findFirst was called with organizationId for tenant isolation
    expect(mockTx.stockBatch.findFirst).toHaveBeenCalledWith({
      where: { id: mockBatchId, organizationId: mockOrgId },
      include: expect.any(Object),
    });

    // Verify transfer item received quantity updated
    expect(mockTx.stockTransferItem.update).toHaveBeenCalledWith({
      where: { id: "transfer-item-1" },
      data: {
        receivedQuantity: {
          increment: expect.any(Decimal),
        },
      },
    });

    // Verify bulk batch quantity decremented
    expect(mockTx.stockBatch.update).toHaveBeenCalledWith({
      where: { id: mockBatchId },
      data: { currentQuantity: { decrement: 5 } },
    });

    // Verify base batch creation at destination location
    expect(mockTx.stockBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          locationId: "loc-to",
          parentId: mockBatchId,
        }),
      }),
    );
  });

  it("should throw NotFoundException if batch does not exist or belongs to another tenant", async () => {
    mockTx.stockBatch.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute(mockOrgId, mockMemberId, "other-tenant-batch"),
    ).rejects.toThrow(NotFoundException);

    expect(mockTx.stockBatch.findFirst).toHaveBeenCalledWith({
      where: { id: "other-tenant-batch", organizationId: mockOrgId },
      include: expect.any(Object),
    });
  });

  it("should throw BadRequestException if batch is not associated with an active transfer", async () => {
    const invalidBatch = {
      ...mockBatch,
      transferItems: [], // No active transfer
    };
    mockTx.stockBatch.findFirst.mockResolvedValue(invalidBatch);

    await expect(
      useCase.execute(mockOrgId, mockMemberId, mockBatchId),
    ).rejects.toThrow(BadRequestException);
  });
});
