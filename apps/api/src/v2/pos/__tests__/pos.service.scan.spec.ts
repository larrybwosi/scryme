import { Test, TestingModule } from "@nestjs/testing";
import { PosService } from "../pos.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { InventoryService } from "../../inventory/inventory.service";
import { PosCustomerService } from "../pos-customer.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "decimal.js";
import * as apiV2Shared from "@repo/shared/api/v2";

// Mock the shared QR token verification
vi.mock("@repo/shared/api/v2", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    verifyQRToken: vi.fn(),
    getDocumentUrl: vi.fn((type, id, orgId) => `https://api.test/${type}/${id}`),
  };
});

describe("PosService.scanTransaction", () => {
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
              transaction: {
                findFirst: vi.fn(),
              },
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
  });

  it("should return formatted transaction data with optimized selection", async () => {
    const mockCode = "qr_code_payload";
    const mockTransactionId = "tx_123";

    // Mock QR token verification
    vi.mocked(apiV2Shared.verifyQRToken).mockReturnValue({
      transactionId: mockTransactionId,
      organizationId: "org_123",
    } as any);

    const mockDate = new Date();
    const mockTransaction = {
      id: mockTransactionId,
      number: "TRX-001",
      status: "COMPLETED",
      finalTotal: new Decimal(150.5),
      paymentStatus: "PAID",
      createdAt: mockDate,
      customer: { name: "John Doe" },
      items: [
        {
          productName: "Product 1",
          sku: "SKU-001",
          quantity: 2,
          lineTotal: new Decimal(100),
        },
        {
          productName: "Product 2",
          sku: "SKU-002",
          quantity: 1,
          lineTotal: new Decimal(50.5),
        },
      ],
    };

    vi.mocked(prisma.client.transaction.findFirst).mockResolvedValue(mockTransaction as any);

    const result = await service.scanTransaction(mockCtx, mockCode);

    expect(prisma.client.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: mockTransactionId, organizationId: "org_123" },
      select: {
        id: true,
        number: true,
        status: true,
        finalTotal: true,
        paymentStatus: true,
        createdAt: true,
        customer: { select: { name: true } },
        items: {
          select: {
            productName: true,
            sku: true,
            quantity: true,
            lineTotal: true,
          },
        },
      },
    });

    expect(result).toEqual({
      id: mockTransactionId,
      number: "TRX-001",
      status: "COMPLETED",
      total: mockTransaction.finalTotal,
      paymentStatus: "PAID",
      customerName: "John Doe",
      itemCount: 2,
      items: [
        {
          name: "Product 1",
          sku: "SKU-001",
          quantity: 2,
          total: mockTransaction.items[0].lineTotal,
        },
        {
          name: "Product 2",
          sku: "SKU-002",
          quantity: 1,
          total: mockTransaction.items[1].lineTotal,
        },
      ],
      createdAt: mockDate,
      invoiceUrl: "https://api.test/invoice/tx_123",
      waybillUrl: "https://api.test/waybill/tx_123",
    });
  });

  it("should return 'Guest' if customer is not present", async () => {
    vi.mocked(apiV2Shared.verifyQRToken).mockReturnValue({
      transactionId: "tx_123",
      organizationId: "org_123",
    } as any);

    vi.mocked(prisma.client.transaction.findFirst).mockResolvedValue({
      id: "tx_123",
      number: "TRX-001",
      status: "COMPLETED",
      finalTotal: new Decimal(100),
      paymentStatus: "PAID",
      createdAt: new Date(),
      customer: null,
      items: [],
    } as any);

    const result = await service.scanTransaction(mockCtx, "code");
    expect(result.customerName).toBe("Guest");
  });
});

describe("PosService.createStockRequest", () => {
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
              productVariant: {
                findMany: vi.fn(),
              },
              stockRequest: {
                findFirst: vi.fn(),
                create: vi.fn(),
              },
              actionAuditLog: {
                create: vi.fn(),
              },
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
  });

  it("should successfully create a stock request using Map-based lookup optimization", async () => {
    const mockBody = {
      toLocationId: "loc_target",
      priority: "HIGH",
      justification: "Test justification",
      items: [
        { variantId: "var_1", requestedQuantity: 10, reason: "Need stock" },
        { variantId: "var_2", requestedQuantity: 5, reason: "Backordered" },
      ],
    };

    const mockVariants = [
      { id: "var_1", sku: "SKU-1", name: "Variant 1", buyingPrice: new Decimal(10) },
      { id: "var_2", sku: "SKU-2", name: "Variant 2", buyingPrice: new Decimal(20) },
    ];

    vi.mocked(prisma.client.productVariant.findMany).mockResolvedValue(mockVariants as any);
    vi.mocked(prisma.client.stockRequest.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.stockRequest.create).mockResolvedValue({ id: "sr_123", requestNumber: "SR-00001" } as any);

    const result = await service.createStockRequest(mockCtx, mockBody);

    expect(prisma.client.productVariant.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["var_1", "var_2"] },
        product: { organizationId: "org_123" },
      },
    });

    expect(prisma.client.stockRequest.create).toHaveBeenCalledWith({
      data: {
        organizationId: "org_123",
        requestNumber: "SR-00001",
        fromLocationId: "loc_123",
        toLocationId: "loc_target",
        priority: "HIGH",
        justification: "Test justification",
        requestedById: "mem_123",
        totalEstimatedCost: expect.any(Decimal),
        items: {
          create: [
            { variantId: "var_1", requestedQuantity: 10, reason: "Need stock", unitCostAtRequest: new Decimal(10) },
            { variantId: "var_2", requestedQuantity: 5, reason: "Backordered", unitCostAtRequest: new Decimal(20) },
          ],
        },
      },
    });

    expect(result).toEqual({
      success: true,
      data: { id: "sr_123", requestNumber: "SR-00001" },
    });
  });
});
