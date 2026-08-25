import { Test, TestingModule } from "@nestjs/testing";
import { StrapiSyncProcessor } from "../strapi-sync.processor";
import { PrismaService } from "@/prisma/prisma.service";
import { StrapiV4Provider } from "../../providers/strapi-v4.provider";
import { StrapiProductSyncUseCase } from "../../../application/use-cases/strapi-product-sync.use-case";
import { StrapiCustomerSyncUseCase } from "../../../application/use-cases/strapi-customer-sync.use-case";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("StrapiSyncProcessor Security & Isolation", () => {
  let processor: StrapiSyncProcessor;

  const mockPrismaClient = {
    ecommerceConnection: {
      findFirst: vi.fn(),
    },
    strapiConnectionConfig: {
      findUnique: vi.fn(),
    },
    ecommerceProductMapping: {
      findFirst: vi.fn(),
    },
    ecommerceWebhookLog: {
      update: vi.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  const mockStrapiProvider = {
    pushStockToStrapi: vi.fn(),
  };

  const mockProductSyncUseCase = {};
  const mockCustomerSyncUseCase = {};

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrapiSyncProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StrapiV4Provider, useValue: mockStrapiProvider },
        { provide: StrapiProductSyncUseCase, useValue: mockProductSyncUseCase },
        { provide: StrapiCustomerSyncUseCase, useValue: mockCustomerSyncUseCase },
      ],
    }).compile();

    processor = module.get<StrapiSyncProcessor>(StrapiSyncProcessor);
  });

  describe("handleStockPush multi-tenant security", () => {
    it("should throw error when ecommerceConnection does not belong to organizationId", async () => {
      const job = {
        name: "strapi.product.stock.push",
        data: {
          connectionId: "conn-123",
          organizationId: "org-unauthorized",
          productId: "prod-1",
          locationStock: { "loc-1": 10 },
        },
      } as any;

      mockPrismaClient.ecommerceConnection.findFirst.mockResolvedValue(null);

      await expect(processor.process(job)).rejects.toThrow(
        "EcommerceConnection conn-123 not found or access denied for organization org-unauthorized",
      );

      expect(mockPrismaClient.ecommerceConnection.findFirst).toHaveBeenCalledWith({
        where: { id: "conn-123", organizationId: "org-unauthorized" },
      });
    });

    it("should scope ecommerceProductMapping by organizationId", async () => {
      const job = {
        name: "strapi.product.stock.push",
        data: {
          connectionId: "conn-123",
          organizationId: "org-1",
          productId: "prod-1",
          locationStock: { "loc-1": 10 },
        },
      } as any;

      mockPrismaClient.ecommerceConnection.findFirst.mockResolvedValue({
        id: "conn-123",
        organizationId: "org-1",
      });

      mockPrismaClient.strapiConnectionConfig.findUnique.mockResolvedValue({
        strapiUrl: "http://strapi.local",
        apiToken: "token",
        graphqlPath: "/graphql",
      });

      mockPrismaClient.ecommerceProductMapping.findFirst.mockResolvedValue({
        id: "map-1",
        externalProductId: "99",
      });

      mockStrapiProvider.pushStockToStrapi.mockResolvedValue(undefined);

      await processor.process(job);

      expect(mockPrismaClient.ecommerceProductMapping.findFirst).toHaveBeenCalledWith({
        where: {
          connectionId: "conn-123",
          productId: "prod-1",
          organizationId: "org-1",
        },
      });

      expect(mockStrapiProvider.pushStockToStrapi).toHaveBeenCalledWith(
        {
          strapiUrl: "http://strapi.local",
          apiToken: "token",
          graphqlPath: "/graphql",
        },
        99,
        { "loc-1": 10 },
      );
    });
  });
});
