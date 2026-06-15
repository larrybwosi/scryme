import {vi, describe, it, expect, beforeEach} from "vitest";
import {UnpackBatchUseCase} from "./unpack-batch.use-case";
import {MovementType, StockAdjustmentReason} from "@repo/db";
import {Decimal} from "decimal.js";

describe("UnpackBatchUseCase Edge Cases", () => {
  let unpackBatchUseCase: UnpackBatchUseCase;
  let prisma: any;
  let inventoryMovementService: any;
  let mockTx: any;

  const mockOrgId = "org-1";
  const mockMemberId = "member-1";

  beforeEach(() => {
    inventoryMovementService = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };

    mockTx = {
      stockBatch: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      stockAdjustment: {
        create: vi.fn(),
      },
      purchaseReturn: {
        create: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      productVariantStock: {
        update: vi.fn(),
      },
      productVariant: {
        findUnique: vi.fn().mockResolvedValue({productId: "p1"}),
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async callback => await callback(mockTx)),
        stockBatch: mockTx.stockBatch,
      },
    };

    unpackBatchUseCase = new UnpackBatchUseCase(
      prisma,
      inventoryMovementService,
    );
  });

  it("should unpack batch and handle damages", async () => {
    const bulkBatchId = "bulk-1";
    mockTx.stockBatch.findUnique.mockResolvedValue({
      id: bulkBatchId,
      organizationId: mockOrgId,
      variantId: "v1",
      locationId: "loc-1",
      currentQuantity: new Decimal(10),
      purchasePrice: new Decimal(2400),
      batchNumber: "BULK-001",
      variant: {product: {name: "Test Product"}},
    });

    const dto = {
      batchId: bulkBatchId,
      quantityToUnpack: 2, // 2 cartons
      unitsPerPackage: 24, // 24 pieces per carton
      damagedQuantity: 4, // 4 pieces damaged
    };

    mockTx.stockBatch.create.mockImplementation(({data}: any) => ({
      id: "new-batch",
      ...data,
    }));

    const result = await unpackBatchUseCase.execute(
      mockOrgId,
      mockMemberId,
      dto,
    );

    expect(result.success).toBe(true);
    expect(result.receivedQuantity).toBe(44); // (2 * 24) - 4
    expect(result.damagedQuantity).toBe(4);

    // Verify bulk batch decrement
    expect(mockTx.stockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {id: bulkBatchId},
        data: {currentQuantity: {decrement: 2}},
      }),
    );

    // Verify aggregate stock update for damages
    expect(mockTx.productVariantStock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          currentStock: {decrement: expect.any(Decimal)},
          availableStock: {decrement: expect.any(Decimal)},
        },
      }),
    );
  });

  it("should fail if insufficient quantity in bulk batch", async () => {
    mockTx.stockBatch.findUnique.mockResolvedValue({
      id: "bulk-1",
      currentQuantity: new Decimal(1),
    });

    const dto = {
      batchId: "bulk-1",
      quantityToUnpack: 2,
      unitsPerPackage: 24,
    };

    await expect(
      unpackBatchUseCase.execute(mockOrgId, mockMemberId, dto),
    ).rejects.toThrow("Insufficient quantity in bulk batch.");
  });
});
