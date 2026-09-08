import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { MergeBatchesUseCase } from "./merge-batches.use-case";
import { IStockBatchRepository } from "../../domain/repositories/stock-batch-repository.interface";
import { PrismaService } from "@/prisma/prisma.service";
import { StockBatchEntity } from "../../domain/entities/stock-batch.entity";

describe("MergeBatchesUseCase", () => {
  let useCase: MergeBatchesUseCase;
  let repository: any;
  let prisma: any;

  beforeEach(async () => {
    repository = {
      findByIds: vi.fn(),
    };
    prisma = {
      client: {
        $transaction: vi.fn((cb) => cb(prisma.client)),
        inventoryLocation: {
          findFirst: vi.fn().mockResolvedValue({ id: "loc-target", organizationId: "org-1" }),
        },
        stockBatch: {
          create: vi.fn().mockResolvedValue({ id: "merged-1" }),
          updateMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
        stockMovement: {
          createMany: vi.fn().mockResolvedValue({ count: 3 }),
          create: vi.fn().mockResolvedValue({}),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeBatchesUseCase,
        { provide: IStockBatchRepository, useValue: repository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCase = module.get<MergeBatchesUseCase>(MergeBatchesUseCase);
  });

  it("should merge multiple batches with single read and bulk writes", async () => {
    const orgId = "org-1";
    const batchIds = ["b1", "b2", "b3"];

    repository.findByIds.mockResolvedValue(batchIds.map(id => new StockBatchEntity(
        id, "v1", "BN-"+id, null, "loc-1", 10, 10, 5, null, new Date(), orgId, null, null, null, false, false, new Date(), new Date(), [], undefined, undefined, []
    )));

    await useCase.execute(orgId, "m1", batchIds, "loc-target");

    // Verify optimized read
    expect(repository.findByIds).toHaveBeenCalledTimes(1);
    expect(repository.findByIds).toHaveBeenCalledWith(batchIds);

    // Verify location check
    expect(prisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
      where: { id: "loc-target", organizationId: orgId },
    });

    // Verify optimized writes
    expect(prisma.client.stockBatch.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.client.stockMovement.createMany).toHaveBeenCalledTimes(1);
  });

  it("should throw NotFoundException if target location does not belong to organization", async () => {
    const orgId = "org-1";
    const batchIds = ["b1", "b2"];

    repository.findByIds.mockResolvedValue(batchIds.map(id => new StockBatchEntity(
        id, "v1", "BN-"+id, null, "loc-1", 10, 10, 5, null, new Date(), orgId, null, null, null, false, false, new Date(), new Date(), [], undefined, undefined, []
    )));

    // Location not found / cross-tenant IDOR attempt
    prisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute(orgId, "m1", batchIds, "foreign-loc")
    ).rejects.toThrow("Target location not found");

    expect(prisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign-loc", organizationId: orgId },
    });
  });
});
