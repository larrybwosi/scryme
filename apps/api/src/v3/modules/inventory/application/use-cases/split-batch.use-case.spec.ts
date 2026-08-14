import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SplitBatchUseCase } from "./split-batch.use-case";
import { IStockBatchRepository } from "../../domain/repositories/stock-batch-repository.interface";
import { PrismaService } from "@/prisma/prisma.service";
import { StockBatchEntity } from "../../domain/entities/stock-batch.entity";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("SplitBatchUseCase", () => {
  let useCase: SplitBatchUseCase;
  let repository: any;
  let prisma: any;

  beforeEach(async () => {
    repository = {
      findById: vi.fn(),
    };
    prisma = {
      client: {
        $transaction: vi.fn((cb) => cb(prisma.client)),
        stockBatch: {
          update: vi.fn().mockResolvedValue({}),
          create: vi.fn().mockImplementation((args) => ({
            id: `child-${Date.now()}-${Math.random()}`,
            ...args.data,
          })),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({}),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitBatchUseCase,
        { provide: IStockBatchRepository, useValue: repository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCase = module.get<SplitBatchUseCase>(SplitBatchUseCase);
  });

  it("should split a parent batch into child batches with correct parallel/concurrent writes", async () => {
    const orgId = "org-1";
    const parentId = "parent-batch-1";
    const memberId = "member-1";

    const parentBatch = new StockBatchEntity(
      parentId,
      "variant-1",
      "P-BN-001",
      null,
      "loc-1",
      100,
      100, // currentQuantity
      5,
      null,
      new Date(),
      orgId,
      null,
      null,
      null,
      false,
      false,
      new Date(),
      new Date(),
      [],
      undefined,
      undefined,
      [],
    );

    repository.findById.mockResolvedValue(parentBatch);

    const splits = [
      { quantity: 20, notes: "Shelf A" },
      { quantity: 30, notes: "Shelf B" },
    ];

    const result = await useCase.execute(orgId, parentId, memberId, splits);

    // Verify parent batch retrieval
    expect(repository.findById).toHaveBeenCalledWith(parentId);

    // Verify parent batch deduction
    expect(prisma.client.stockBatch.update).toHaveBeenCalledWith({
      where: { id: parentId },
      data: {
        currentQuantity: { decrement: 50 },
      },
    });

    // Verify child batch creation
    expect(prisma.client.stockBatch.create).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].batchNumber).toBe("P-BN-001-S1");
    expect(result[0].initialQuantity).toBe(20);
    expect(result[1].batchNumber).toBe("P-BN-001-S2");
    expect(result[1].initialQuantity).toBe(30);

    // Verify movements are created (2 for child batches + 1 for parent deduction)
    expect(prisma.client.stockMovement.create).toHaveBeenCalledTimes(3);
  });

  it("should throw NotFoundException if parent batch is not found", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("org-1", "invalid-id", "m1", [{ quantity: 10 }]),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw NotFoundException if parent batch organizationId mismatch", async () => {
    const parentBatch = new StockBatchEntity(
      "parent-1",
      "v1",
      "BN-1",
      null,
      "loc-1",
      100,
      100,
      5,
      null,
      new Date(),
      "org-2", // different org
      null,
      null,
      null,
      false,
      false,
      new Date(),
      new Date(),
      [],
      undefined,
      undefined,
      [],
    );

    repository.findById.mockResolvedValue(parentBatch);

    await expect(
      useCase.execute("org-1", "parent-1", "m1", [{ quantity: 10 }]),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw BadRequestException if split quantity exceeds parent currentQuantity", async () => {
    const parentBatch = new StockBatchEntity(
      "parent-1",
      "v1",
      "BN-1",
      null,
      "loc-1",
      100,
      50, // currentQuantity is 50
      5,
      null,
      new Date(),
      "org-1",
      null,
      null,
      null,
      false,
      false,
      new Date(),
      new Date(),
      [],
      undefined,
      undefined,
      [],
    );

    repository.findById.mockResolvedValue(parentBatch);

    await expect(
      useCase.execute("org-1", "parent-1", "m1", [
        { quantity: 30 },
        { quantity: 21 }, // total is 51 > 50
      ]),
    ).rejects.toThrow(BadRequestException);
  });
});
