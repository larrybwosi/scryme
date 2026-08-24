import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScanUnpackBatchUseCase } from "./scan-unpack-batch.use-case";
import { NotFoundException } from "@nestjs/common";

describe("ScanUnpackBatchUseCase Security", () => {
  let useCase: ScanUnpackBatchUseCase;
  let mockPrisma: any;
  let mockUnpackBatchUseCase: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        $transaction: vi.fn((cb) => cb(mockPrisma.client)),
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
      },
    };

    mockUnpackBatchUseCase = {};

    useCase = new ScanUnpackBatchUseCase(
      mockPrisma as any,
      mockUnpackBatchUseCase as any,
    );
  });

  it("should enforce tenant isolation using findFirst with organizationId", async () => {
    const orgId = "org-1";
    const memberId = "member-1";
    const batchId = "batch-123";

    mockPrisma.client.stockBatch.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute(orgId, memberId, batchId),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.client.stockBatch.findFirst).toHaveBeenCalledWith({
      where: { id: batchId, organizationId: orgId },
      include: expect.any(Object),
    });
  });
});
