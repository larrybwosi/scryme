import { Test, TestingModule } from "@nestjs/testing";
import { PosService } from "../pos.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { InventoryService } from "../../inventory/inventory.service";
import { PosCustomerService } from "../pos-customer.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "decimal.js";
import { NotFoundException } from "@nestjs/common";

describe("PosService.receiveTransfer", () => {
  let service: PosService;
  let prisma: PrismaService;

  const mockCtx: V2ApiContext = {
    organizationId: "org_123",
    memberId: "mem_123",
    locationId: "loc_123",
    permissions: [],
  };

  const mockTx = {
    stockTransfer: {
      update: vi.fn(),
    },
    productVariantStock: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              stockTransfer: {
                findFirst: vi.fn(),
              },
              $transaction: vi.fn(cb => cb(mockTx)),
            },
          },
        },
        { provide: RedisService, useValue: {} },
        { provide: InventoryService, useValue: {} },
        { provide: PosCustomerService, useValue: {} },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    prisma = module.get<PrismaService>(PrismaService);

    vi.clearAllMocks();
  });

  it("should throw NotFoundException if transfer does not exist", async () => {
    vi.mocked(prisma.client.stockTransfer.findFirst).mockResolvedValue(null);

    await expect(
      service.receiveTransfer(mockCtx, "transfer_123", { items: [] }),
    ).rejects.toThrow(NotFoundException);
  });

  it("should return early if transfer is already COMPLETED", async () => {
    const mockTransfer = {
      id: "transfer_123",
      status: "COMPLETED",
      items: [],
    };

    vi.mocked(prisma.client.stockTransfer.findFirst).mockResolvedValue(
      mockTransfer as any,
    );

    const result = await service.receiveTransfer(mockCtx, "transfer_123", {
      items: [],
    });
    expect(result).toEqual({
      success: true,
      message: "Transfer already completed",
    });
    expect(prisma.client.$transaction).not.toHaveBeenCalled();
  });

  it("should successfully receive a transfer and adjust inventory using optimized Map lookup", async () => {
    const mockTransfer = {
      id: "transfer_123",
      status: "SHIPPED",
      fromLocationId: "loc_from",
      toLocationId: "loc_to",
      transferNumber: "TX-999",
      notes: "Transfer notes",
      items: [
        {
          id: "item_1",
          variantId: "var_1",
          requestedQuantity: new Decimal(10),
        },
        {
          id: "item_2",
          variantId: "var_2",
          requestedQuantity: new Decimal(5),
        },
      ],
    };

    const mockBody = {
      notes: "Received at POS",
      items: [
        { variantId: "var_1", acceptedQuantity: 8 },
        { variantId: "var_2", receivedQuantity: 5 },
      ],
    };

    vi.mocked(prisma.client.stockTransfer.findFirst).mockResolvedValue(
      mockTransfer as any,
    );

    // Mock stock exist for var_1, doesn't exist for var_2
    mockTx.productVariantStock.findMany.mockImplementation(({ where }) => {
      const results = [];
      if (where.variantId.in.includes("var_1")) {
        results.push({ id: "stock_1", variantId: "var_1", currentStock: new Decimal(20) });
      }
      return Promise.resolve(results);
    });

    // Mock variant findMany for variants
    mockTx.productVariant.findMany.mockResolvedValue([
      { id: "var_1", productId: "prod_1" },
      { id: "var_2", productId: "prod_2" },
    ] as any);

    const result = await service.receiveTransfer(
      mockCtx,
      "transfer_123",
      mockBody,
    );

    expect(result).toEqual({ success: true });

    // Verify stockTransfer status update
    expect(mockTx.stockTransfer.update).toHaveBeenCalledWith({
      where: { id: "transfer_123" },
      data: {
        status: "COMPLETED",
        receivedById: "mem_123",
        receivedDate: expect.any(Date),
        completedDate: expect.any(Date),
        notes: "Received at POS",
      },
    });

    // Verify stock checks & adjustments
    expect(mockTx.productVariantStock.findMany).toHaveBeenCalledTimes(1);
    expect(mockTx.productVariant.findMany).toHaveBeenCalledTimes(1);

    // var_1 has stock -> incremented by acceptedQuantity (8)
    expect(mockTx.productVariantStock.update).toHaveBeenCalledWith({
      where: { id: "stock_1" },
      data: {
        currentStock: { increment: new Decimal(8) },
        availableStock: { increment: new Decimal(8) },
      },
    });

    // var_2 has no stock -> created with receivedQuantity (5)
    expect(mockTx.productVariantStock.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org_123",
        productId: "prod_2",
        variantId: "var_2",
        locationId: "loc_to",
        currentStock: new Decimal(5),
        availableStock: new Decimal(5),
      },
    });

    // Verify stock movements created
    expect(mockTx.stockMovement.create).toHaveBeenCalledTimes(2);
    expect(mockTx.stockMovement.create).toHaveBeenNthCalledWith(1, {
      data: {
        organizationId: "org_123",
        variantId: "var_1",
        quantity: new Decimal(8),
        fromLocationId: "loc_from",
        toLocationId: "loc_to",
        movementType: "TRANSFER",
        referenceId: "transfer_123",
        referenceType: "StockTransfer",
        memberId: "mem_123",
        notes: "Transfer TX-999 Completed via POS",
      },
    });
  });
});

describe("PosService.sync", () => {
  let service: PosService;
  let prisma: PrismaService;

  const mockCtx: V2ApiContext = {
    organizationId: "org_123",
    memberId: "mem_123",
    locationId: "loc_123",
    permissions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              category: {
                findMany: vi.fn(),
              },
            },
          },
        },
        { provide: RedisService, useValue: {} },
        { provide: InventoryService, useValue: {} },
        {
          provide: PosCustomerService,
          useValue: {
            getCustomersDelta: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    prisma = module.get<PrismaService>(PrismaService);

    vi.clearAllMocks();
  });

  it("should sync products, customers, and categories without lastSync filtering when lastSync is not provided", async () => {
    const mockCategories = [
      { id: "cat_1", name: "Category 1", description: "Desc 1" },
    ];

    vi.spyOn(service, "getProducts").mockResolvedValue({
      products: [],
      pagination: {},
    } as any);

    vi.mocked(prisma.client.category.findMany).mockResolvedValue(
      mockCategories as any,
    );

    const result = await service.sync(mockCtx, { locationId: "loc_123" });

    expect(prisma.client.category.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org_123",
      },
      select: { id: true, name: true, description: true },
    });

    expect(result.categories).toEqual(mockCategories);
  });

  it("should filter categories by updatedAt when lastSync is provided in the query parameters", async () => {
    const lastSyncStr = "2026-07-30T00:00:00.000Z";
    const mockCategories = [
      { id: "cat_2", name: "Category 2", description: "Desc 2" },
    ];

    vi.spyOn(service, "getProducts").mockResolvedValue({
      products: [],
      pagination: {},
    } as any);

    vi.mocked(prisma.client.category.findMany).mockResolvedValue(
      mockCategories as any,
    );

    const result = await service.sync(mockCtx, {
      locationId: "loc_123",
      lastSync: lastSyncStr,
    });

    expect(prisma.client.category.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org_123",
        updatedAt: { gt: new Date(lastSyncStr) },
      },
      select: { id: true, name: true, description: true },
    });

    expect(result.categories).toEqual(mockCategories);
  });
});
