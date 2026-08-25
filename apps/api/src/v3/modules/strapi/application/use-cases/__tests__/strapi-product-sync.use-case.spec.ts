import { Test, TestingModule } from "@nestjs/testing";
import { StrapiProductSyncUseCase } from "../strapi-product-sync.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { StrapiV4Provider } from "../../../infrastructure/providers/strapi-v4.provider";
import { StrapiConnectionUseCase } from "../strapi-connection.use-case";
import { SyncDirection, SyncStatus, EntitySyncType } from "@repo/db";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("StrapiProductSyncUseCase", () => {
  let useCase: StrapiProductSyncUseCase;
  let prisma: PrismaService;
  let strapiProvider: StrapiV4Provider;
  let connectionUseCase: StrapiConnectionUseCase;

  const mockPrismaClient = {
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productVariant: {
      create: vi.fn(),
    },
    ecommerceProductMapping: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    ecommerceSyncLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
    ecommerceConnection: {
      update: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  const mockStrapiProvider = {
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    getProducts: vi.fn(),
  };

  const mockConnectionUseCase = {
    getConnectionOrThrow: vi.fn(),
    getConfigOrThrow: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrapiProductSyncUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StrapiV4Provider, useValue: mockStrapiProvider },
        { provide: StrapiConnectionUseCase, useValue: mockConnectionUseCase },
      ],
    }).compile();

    useCase = module.get<StrapiProductSyncUseCase>(StrapiProductSyncUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    strapiProvider = module.get<StrapiV4Provider>(StrapiV4Provider);
    connectionUseCase = module.get<StrapiConnectionUseCase>(StrapiConnectionUseCase);
  });

  describe("syncOutbound", () => {
    it("should successfully sync products to Strapi using chunked parallelization", async () => {
      const orgId = "org-1";
      const connId = "conn-1";

      mockConnectionUseCase.getConnectionOrThrow.mockResolvedValue({ id: connId });
      mockConnectionUseCase.getConfigOrThrow.mockResolvedValue({
        strapiUrl: "http://strapi.local",
        apiToken: "token-1",
        graphqlPath: "/graphql",
      });

      mockPrismaClient.ecommerceSyncLog.create.mockResolvedValue({ id: "sync-log-1" });
      mockPrismaClient.ecommerceConnection.update.mockResolvedValue({});

      // Return 12 products to verify chunks are processed (chunk size is 10, so 2 chunks)
      const mockProducts = Array.from({ length: 12 }, (_, index) => ({
        id: `prod-${index}`,
        name: `Product ${index}`,
        variants: [
          {
            variantStocks: [{ locationId: "loc-1", currentStock: 5 }],
            priceListItems: [{ price: 10 }],
          },
        ],
      }));

      mockPrismaClient.product.findMany.mockResolvedValue(mockProducts);

      // Return existing mappings for first 5 products, and none for the rest
      const mockMappings = Array.from({ length: 5 }, (_, index) => ({
        id: `map-${index}`,
        productId: `prod-${index}`,
        externalProductId: `strapi-${index}`,
      }));

      mockPrismaClient.ecommerceProductMapping.findMany.mockResolvedValue(mockMappings);

      // Mock Strapi provider responses
      mockStrapiProvider.updateProduct.mockResolvedValue({});
      mockStrapiProvider.createProduct.mockImplementation((config, payload) => {
        return Promise.resolve({ data: { id: `new-strapi-${payload.name}` } });
      });

      mockPrismaClient.ecommerceProductMapping.create.mockResolvedValue({});
      mockPrismaClient.ecommerceProductMapping.update.mockResolvedValue({});
      mockPrismaClient.ecommerceSyncLog.update.mockResolvedValue({});

      const result = await useCase.syncOutbound(orgId, connId);

      expect(result.totalItems).toBe(12);
      expect(result.successCount).toBe(12);
      expect(result.failureCount).toBe(0);

      // Verify that updateProduct was called 5 times
      expect(mockStrapiProvider.updateProduct).toHaveBeenCalledTimes(5);

      // Verify that createProduct was called 7 times
      expect(mockStrapiProvider.createProduct).toHaveBeenCalledTimes(7);

      // Verify that the final sync status was updated as COMPLETED
      expect(mockPrismaClient.ecommerceSyncLog.update).toHaveBeenCalledWith({
        where: { id: "sync-log-1" },
        data: expect.objectContaining({
          status: SyncStatus.COMPLETED,
          totalItems: 12,
          successCount: 12,
        }),
      });
    });

    it("should handle partial failures gracefully", async () => {
      const orgId = "org-1";
      const connId = "conn-1";

      mockConnectionUseCase.getConnectionOrThrow.mockResolvedValue({ id: connId });
      mockConnectionUseCase.getConfigOrThrow.mockResolvedValue({
        strapiUrl: "http://strapi.local",
        apiToken: "token-1",
        graphqlPath: "/graphql",
      });

      mockPrismaClient.ecommerceSyncLog.create.mockResolvedValue({ id: "sync-log-1" });
      mockPrismaClient.ecommerceConnection.update.mockResolvedValue({});

      const mockProducts = [
        {
          id: "prod-1",
          name: "Success Product",
          variants: [],
        },
        {
          id: "prod-2",
          name: "Fail Product",
          variants: [],
        },
      ];

      mockPrismaClient.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaClient.ecommerceProductMapping.findMany.mockResolvedValue([]);

      mockStrapiProvider.createProduct.mockImplementation((config, payload) => {
        if (payload.name === "Fail Product") {
          return Promise.reject(new Error("Strapi API Error"));
        }
        return Promise.resolve({ data: { id: "strapi-1" } });
      });

      const result = await useCase.syncOutbound(orgId, connId);

      expect(result.totalItems).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.errors).toContain("Product prod-2 (Fail Product): Strapi API Error");

      expect(mockPrismaClient.ecommerceSyncLog.update).toHaveBeenCalledWith({
        where: { id: "sync-log-1" },
        data: expect.objectContaining({
          status: SyncStatus.PARTIALLY_COMPLETED,
          totalItems: 2,
          successCount: 1,
          failureCount: 1,
        }),
      });
    });
  });

  describe("syncInbound", () => {
    it("should successfully sync products from Strapi into Scryme catalog using category cache", async () => {
      const orgId = "org-1";
      const connId = "conn-1";

      mockConnectionUseCase.getConnectionOrThrow.mockResolvedValue({ id: connId });
      mockConnectionUseCase.getConfigOrThrow.mockResolvedValue({
        strapiUrl: "http://strapi.local",
        apiToken: "token-1",
        graphqlPath: "/graphql",
      });

      mockPrismaClient.ecommerceSyncLog.create.mockResolvedValue({ id: "sync-log-2" });
      mockPrismaClient.ecommerceConnection.update.mockResolvedValue({});

      // Mock existing categories
      mockPrismaClient.category.findMany.mockResolvedValue([
        { id: "cat-1", name: "Bread", organizationId: orgId },
      ]);

      // Mock Strapi getProducts returning 2 products
      mockStrapiProvider.getProducts.mockResolvedValue({
        data: [
          {
            id: 101,
            attributes: {
              name: "Sourdough Bread",
              sku: "SOUR-1",
              categories: {
                data: [{ attributes: { name: "Bread" } }],
              },
            },
          },
          {
            id: 102,
            attributes: {
              name: "Muffin",
              sku: "MUF-1",
              categories: {
                data: [{ attributes: { name: "Pastry" } }],
              },
            },
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 100,
            pageCount: 1,
            total: 2,
          },
        },
      });

      // Mock mapping lookup
      mockPrismaClient.ecommerceProductMapping.findMany.mockResolvedValue([
        {
          id: "map-1",
          productId: "prod-existing-1",
          externalProductId: "101",
        },
      ]);

      mockPrismaClient.product.update.mockResolvedValue({});
      mockPrismaClient.ecommerceProductMapping.update.mockResolvedValue({});

      mockPrismaClient.category.findFirst.mockResolvedValue(null);
      mockPrismaClient.category.create.mockResolvedValue({ id: "cat-new", name: "Pastry" });
      mockPrismaClient.product.create.mockResolvedValue({ id: "prod-new" });
      mockPrismaClient.productVariant.create.mockResolvedValue({ id: "variant-new" });
      mockPrismaClient.ecommerceProductMapping.create.mockResolvedValue({});

      const result = await useCase.syncInbound(orgId, connId);

      expect(result.totalItems).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);

      // Verify Sourdough Bread (existing mapping) updated the local product
      expect(mockPrismaClient.product.update).toHaveBeenCalledWith({
        where: { id: "prod-existing-1" },
        data: { name: "Sourdough Bread", description: null },
      });

      // Verify Muffin (new mapping) created category "Pastry" and product
      expect(mockPrismaClient.category.create).toHaveBeenCalledWith({
        data: { organizationId: orgId, name: "Pastry", code: "PASTRY" },
      });
      expect(mockPrismaClient.product.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name: "Muffin",
          description: null,
          sku: "MUF-1",
          categoryId: "cat-new",
        },
      });
    });

    it("should process inbound products in chunked parallel batches and deduplicate category resolution", async () => {
      const orgId = "org-1";
      const connId = "conn-1";

      mockConnectionUseCase.getConnectionOrThrow.mockResolvedValue({ id: connId });
      mockConnectionUseCase.getConfigOrThrow.mockResolvedValue({
        strapiUrl: "http://strapi.local",
        apiToken: "token-1",
        graphqlPath: "/graphql",
      });

      mockPrismaClient.ecommerceSyncLog.create.mockResolvedValue({ id: "sync-log-3" });
      mockPrismaClient.ecommerceConnection.update.mockResolvedValue({});
      mockPrismaClient.category.findMany.mockResolvedValue([]);

      // Return 15 Strapi products share the same brand new category "Beverages"
      const mockStrapiData = Array.from({ length: 15 }, (_, i) => ({
        id: 200 + i,
        attributes: {
          name: `Drink ${i}`,
          sku: `DRINK-${i}`,
          categories: {
            data: [{ attributes: { name: "Beverages" } }],
          },
        },
      }));

      mockStrapiProvider.getProducts.mockResolvedValue({
        data: mockStrapiData,
        meta: {
          pagination: { page: 1, pageSize: 100, pageCount: 1, total: 15 },
        },
      });

      mockPrismaClient.ecommerceProductMapping.findMany.mockResolvedValue([]);
      mockPrismaClient.category.findFirst.mockResolvedValue(null);
      mockPrismaClient.category.create.mockResolvedValue({ id: "cat-bev", name: "Beverages" });
      mockPrismaClient.product.create.mockImplementation((args) =>
        Promise.resolve({ id: `prod-${args.data.name}` })
      );
      mockPrismaClient.productVariant.create.mockResolvedValue({ id: "variant-1" });
      mockPrismaClient.ecommerceProductMapping.create.mockResolvedValue({});
      mockPrismaClient.ecommerceSyncLog.update.mockResolvedValue({});

      const result = await useCase.syncInbound(orgId, connId);

      expect(result.totalItems).toBe(15);
      expect(result.successCount).toBe(15);
      expect(result.failureCount).toBe(0);

      // Category "Beverages" should only be created ONCE despite 15 concurrent items
      expect(mockPrismaClient.category.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.product.create).toHaveBeenCalledTimes(15);
    });
  });
});
