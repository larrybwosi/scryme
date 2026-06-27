import { Test, TestingModule } from "@nestjs/testing";
import { BakeryService } from "../bakery.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "../../../auth/auth.service";
import { Decimal } from "decimal.js";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("BakeryService.completeBatch", () => {
  let service: BakeryService;
  let prisma: PrismaService;

  const mockTx = {
    batch: {
      update: vi.fn(),
    },
    stockBatch: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    batchIngredientConsumption: {
      createMany: vi.fn(),
    },
    stockMovement: {
      createMany: vi.fn(),
      create: vi.fn(),
    },
    productVariantStock: {
      update: vi.fn(),
      upsert: vi.fn(),
    },
  };

  const mockPrisma = {
    client: {
      batch: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(cb => cb(mockTx)),
    },
  };

  const mockAuthService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BakeryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<BakeryService>(BakeryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should complete batch and process ingredient consumptions in batch", async () => {
    const ctx: any = {
      organizationId: "org-1",
      memberId: "mem-1",
      locationId: "loc-1",
    };
    const batchId = "batch-1";
    const data = {
      actualQuantity: 100,
      wasteQuantity: 5,
      ingredientConsumptions: [
        { stockBatchId: "sb-1", quantity: 10 },
        { stockBatchId: "sb-2", quantity: 20 },
        { stockBatchId: "sb-1", quantity: 5 }, // Aggregate same stock batch
      ],
    };

    const mockBatch = {
      id: batchId,
      batchNumber: "B1",
      recipe: {
        producesVariantId: "pv-1",
        producesVariant: { productId: "p-1" },
        costPrice: 50,
      },
    };

    const mockStockBatches = [
      {
        id: "sb-1",
        variantId: "v-1",
        locationId: "loc-1",
        currentQuantity: new Decimal(20),
      },
      {
        id: "sb-2",
        variantId: "v-2",
        locationId: "loc-1",
        currentQuantity: new Decimal(30),
      },
    ];

    mockPrisma.client.batch.findUnique.mockResolvedValue(mockBatch);
    mockTx.stockBatch.findMany.mockResolvedValue(mockStockBatches);
    mockTx.batch.update.mockResolvedValue({
      ...mockBatch,
      status: "COMPLETED",
    });
    mockTx.stockBatch.create.mockResolvedValue({ id: "sb-new" });

    await service.completeBatch(ctx, batchId, data);

    // Verify batch fetch
    expect(mockPrisma.client.batch.findUnique).toHaveBeenCalledWith({
      where: { id: batchId, organizationId: "org-1" },
      include: expect.anything(),
    });

    // Verify stock batch pre-fetch
    expect(mockTx.stockBatch.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["sb-1", "sb-2", "sb-1"] } },
    });

    // Verify batch createMany
    expect(mockTx.batchIngredientConsumption.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.anything()]),
    });
    expect(mockTx.stockMovement.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.anything()]),
    });

    // Verify aggregated updates for stockBatch
    // sb-1 should be decremented by 15 (10 + 5)
    expect(mockTx.stockBatch.update).toHaveBeenCalledWith({
      where: { id: "sb-1" },
      data: { currentQuantity: { decrement: new Decimal(15) } },
    });
    expect(mockTx.stockBatch.update).toHaveBeenCalledWith({
      where: { id: "sb-2" },
      data: { currentQuantity: { decrement: new Decimal(20) } },
    });

    // Verify aggregated updates for productVariantStock
    expect(mockTx.productVariantStock.update).toHaveBeenCalledWith({
      where: {
        variantId_locationId: { variantId: "v-1", locationId: "loc-1" },
      },
      data: {
        currentStock: { decrement: new Decimal(15) },
        availableStock: { decrement: new Decimal(15) },
      },
    });
  });

  it("should throw BadRequestException if aggregated consumption exceeds available stock", async () => {
    const ctx: any = { organizationId: "org-1" };
    const data = {
      ingredientConsumptions: [
        { stockBatchId: "sb-1", quantity: 15 },
        { stockBatchId: "sb-1", quantity: 10 }, // Total 25
      ],
    };

    const mockBatch = { id: "b1", recipe: {} };
    const mockStockBatches = [
      { id: "sb-1", currentQuantity: new Decimal(20) }, // 20 < 25
    ];

    mockPrisma.client.batch.findUnique.mockResolvedValue(mockBatch);
    mockTx.stockBatch.findMany.mockResolvedValue(mockStockBatches);

    await expect(service.completeBatch(ctx, "b1", data)).rejects.toThrow(
      BadRequestException,
    );
  });
});
