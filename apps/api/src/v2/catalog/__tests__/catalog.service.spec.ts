import {Test, TestingModule} from "@nestjs/testing";
import {vi, describe, it, expect, beforeEach} from "vitest";

// Use hoisted to define mock objects needed in vi.mock
const {mockDb} = vi.hoisted(() => ({
  mockDb: {
    product: {findMany: vi.fn(), count: vi.fn()},
    category: {findMany: vi.fn()},
  },
  PrismaClient: class {},
  PaymentStatus: {
    PENDING: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
    UNPAID: "UNPAID",
    PARTIAL: "PARTIAL",
  },
}));

// Mock @repo/shared/server
vi.mock("@repo/shared/server", () => ({
  V2ApiContext: {},
}));

// Mock @repo/suppliers
vi.mock("@repo/suppliers", () => ({
  SupplierService: vi.fn(),
}));

import {CatalogService} from "../catalog.service";
import {PrismaService} from "@/prisma/prisma.service";
import {RedisService} from "../../../redis/redis.service";
import {SupplierService} from "@repo/suppliers/server";
import {V2ApiContext} from "@repo/shared/server";

describe("CatalogService", () => {
  let service: CatalogService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: SupplierService,
          useValue: {
            getSuppliers: vi.fn(),
            getSupplier: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {client: mockDb},
        },
        {
          provide: SupplierService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {
            get: vi.fn(),
            setex: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProducts", () => {
    it("should return products from database if cache is empty", async () => {
      const orgId = "org-1";
      const products = [{id: "1", sku: "S1", name: "Product 1", variants: []}];
      (mockDb.product.findMany as any).mockResolvedValue(products);
      (mockDb.product.count as any).mockResolvedValue(1);
      (redis.get as any).mockResolvedValue(null);

      const result = await service.getProducts(
        {organizationId: orgId} as V2ApiContext,
        {},
      );

      expect(result.products).toBeDefined();
      expect(mockDb.product.findMany).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalled();
    });

    it("should return products from cache if available", async () => {
      const orgId = "org-1";
      const products = [{id: "1", sku: "S1", name: "Product 1", variants: []}];
      const cacheValue = {products, pagination: {}};
      (redis.get as any).mockResolvedValue(cacheValue);

      const result = await service.getProducts(
        {organizationId: orgId} as V2ApiContext,
        {},
      );

      expect(result).toEqual(cacheValue);
      expect(mockDb.product.findMany).not.toHaveBeenCalled();
    });

    it("should correctly paginate when inStock=true", async () => {
      const orgId = "org-1";
      // Mock only the in-stock product being returned by the DB
      const products = [
        {
          id: "1",
          sku: "S1",
          name: "In Stock",
          variants: [
            {
              id: "v1",
              variantStocks: [{availableStock: 10}],
            },
          ],
        },
      ];
      (mockDb.product.findMany as any).mockResolvedValue(products);
      // Mock the count being 1 (only in-stock products)
      (mockDb.product.count as any).mockResolvedValue(1);
      (redis.get as any).mockResolvedValue(null);

      const result = await service.getProducts(
        {organizationId: orgId} as V2ApiContext,
        {inStock: "true"},
      );

      // Verified behavior: products are filtered by the DB
      expect(result.products).toHaveLength(1);
      expect(result.products[0].internalId).toBe("1");

      // Verified fix: pagination.total is 1, matching the returned products
      expect(result.pagination.total).toBe(1);

      // Verify DB query had the correct filter
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            variants: {
              some: {
                variantStocks: {
                  some: {availableStock: {gt: 0}},
                },
              },
            },
          }),
        }),
      );
    });
  });
});
