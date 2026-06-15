import {describe, it, expect, vi, beforeEach} from "vitest";
import {UnpackBatchUseCase, UnpackBatchDto} from "./unpack-batch.use-case";
import {NotFoundException, BadRequestException} from "@nestjs/common";
import {MovementType, StockAdjustmentReason} from "@repo/db";
import {Decimal} from "decimal.js";

// Mock PrismaService to avoid @repo/db issues during testing
vi.mock("src/prisma/prisma.service", () => {
  return {
    PrismaService: vi.fn().mockImplementation(() => ({
      client: {
        $transaction: vi.fn(
          async cb =>
            await cb({
              stockBatch: {
                findUnique: vi.fn(),
                update: vi.fn(),
                create: vi.fn(),
              },
              stockAdjustment: {
                create: vi.fn(),
              },
              productVariantStock: {
                update: vi.fn(),
              },
            }),
        ),
      },
    })),
  };
});

describe("UnpackBatchUseCase", () => {
  let useCase: UnpackBatchUseCase;
  let prisma: any;
  let inventoryMovementService: any;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      stockBatch: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      stockAdjustment: {
        create: vi.fn(),
      },
      productVariantStock: {
        update: vi.fn(),
      },
    };
    prisma = {
      client: {
        $transaction: vi.fn(async cb => await cb(mockTx)),
      },
    };
    inventoryMovementService = {
      recordMovement: vi.fn(),
    };
    useCase = new UnpackBatchUseCase(
      prisma as any,
      inventoryMovementService as any,
    );
  });

  const mockBulkBatch = {
    id: "batch-1",
    organizationId: "org-1",
    variantId: "variant-1",
    locationId: "loc-1",
    batchNumber: "B-001",
    currentQuantity: new Decimal(10),
    purchasePrice: new Decimal(240),
    receivedDate: new Date(),
    qualityCheckStatus: "PASSED",
    variant: {
      product: {
        name: "Test Book",
      },
    },
  };

  it("should unpack a batch successfully", async () => {
    mockTx.stockBatch.findUnique.mockResolvedValue(mockBulkBatch);
    mockTx.stockBatch.create.mockResolvedValue({id: "base-batch-1"});

    const dto: UnpackBatchDto = {
      batchId: "batch-1",
      quantityToUnpack: 2,
      unitsPerPackage: 24,
      targetSystemUnitId: "piece-unit-id",
    };

    const result = await useCase.execute("org-1", "member-1", dto);

    expect(result.success).toBe(true);
    expect(mockTx.stockBatch.update).toHaveBeenCalledWith({
      where: {id: "batch-1"},
      data: {currentQuantity: {decrement: 2}},
    });
    expect(mockTx.stockBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          initialQuantity: expect.any(Object),
          currentQuantity: expect.any(Object),
          purchasePrice: expect.any(Object),
        }),
      }),
    );

    // Check decimal values
    const createCall = mockTx.stockBatch.create.mock.calls[0][0].data;
    expect(new Decimal(createCall.initialQuantity.toString()).toNumber()).toBe(
      48,
    );
    expect(new Decimal(createCall.purchasePrice.toString()).toNumber()).toBe(
      10,
    );

    expect(inventoryMovementService.recordMovement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        movementType: MovementType.UNPACK_OUT,
        quantity: 2,
      }),
    );
    expect(inventoryMovementService.recordMovement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        movementType: MovementType.UNPACK_IN,
        quantity: 48,
      }),
    );
  });

  it("should handle damages during unpacking", async () => {
    mockTx.stockBatch.findUnique.mockResolvedValue(mockBulkBatch);
    mockTx.stockBatch.create.mockImplementation(async params => {
      if (params.data.batchNumber.startsWith("DAMAGED"))
        return {id: "damaged-batch"};
      return {id: "base-batch-1"};
    });
    mockTx.stockAdjustment.create.mockResolvedValue({id: "adj-1"});

    const dto: UnpackBatchDto = {
      batchId: "batch-1",
      quantityToUnpack: 1,
      unitsPerPackage: 24,
      damagedQuantity: 5,
    };

    const result = await useCase.execute("org-1", "member-1", dto);

    expect(result.success).toBe(true);
    expect(result.receivedQuantity).toBe(19); // 24 - 5
    expect(result.damagedQuantity).toBe(5);

    expect(mockTx.stockBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          initialQuantity: expect.any(Object),
        }),
      }),
    );

    expect(mockTx.stockBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          batchNumber: expect.stringContaining("DAMAGED"),
          initialQuantity: expect.any(Object),
          currentQuantity: 0,
        }),
      }),
    );

    expect(mockTx.stockAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: StockAdjustmentReason.DAMAGED,
          quantity: expect.any(Object),
        }),
      }),
    );

    expect(mockTx.productVariantStock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          currentStock: {decrement: expect.any(Object)},
          availableStock: {decrement: expect.any(Object)},
        },
      }),
    );
  });

  it("should throw NotFoundException if batch not found", async () => {
    mockTx.stockBatch.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute("org-1", "member-1", {
        batchId: "unknown",
        quantityToUnpack: 1,
        unitsPerPackage: 10,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw BadRequestException if insufficient quantity", async () => {
    mockTx.stockBatch.findUnique.mockResolvedValue(mockBulkBatch);

    await expect(
      useCase.execute("org-1", "member-1", {
        batchId: "batch-1",
        quantityToUnpack: 20, // Only 10 available
        unitsPerPackage: 10,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
