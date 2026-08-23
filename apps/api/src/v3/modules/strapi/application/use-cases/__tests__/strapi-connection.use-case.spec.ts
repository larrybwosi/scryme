import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { StrapiConnectionUseCase } from "../strapi-connection.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { StrapiV4Provider } from "../../../infrastructure/providers/strapi-v4.provider";
import { isSafeUrl } from "@repo/shared/server";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@repo/shared/server", () => ({
  isSafeUrl: vi.fn(),
}));

describe("StrapiConnectionUseCase", () => {
  let useCase: StrapiConnectionUseCase;
  let prisma: PrismaService;
  let strapiProvider: StrapiV4Provider;

  const mockPrismaClient = {
    ecommerceConnection: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    strapiConnectionConfig: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrismaClient)),
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  const mockStrapiProvider = {
    ping: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrapiConnectionUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StrapiV4Provider, useValue: mockStrapiProvider },
      ],
    }).compile();

    useCase = module.get<StrapiConnectionUseCase>(StrapiConnectionUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    strapiProvider = module.get<StrapiV4Provider>(StrapiV4Provider);
  });

  describe("create", () => {
    it("should throw BadRequestException when strapiUrl is an unsafe/internal URL (SSRF protection)", async () => {
      vi.mocked(isSafeUrl).mockResolvedValue(false);

      await expect(
        useCase.create("org-1", {
          name: "Malicious Strapi",
          strapiUrl: "http://169.254.169.254/latest/meta-data",
          apiToken: "token-123",
        }),
      ).rejects.toThrow(BadRequestException);

      expect(isSafeUrl).toHaveBeenCalledWith("http://169.254.169.254/latest/meta-data");
      expect(mockStrapiProvider.ping).not.toHaveBeenCalled();
    });

    it("should proceed and create connection when strapiUrl is safe", async () => {
      vi.mocked(isSafeUrl).mockResolvedValue(true);
      mockStrapiProvider.ping.mockResolvedValue({ strapiVersion: "4.15.0" });

      const mockConn = {
        id: "conn-1",
        name: "Safe Strapi",
        storeUrl: "https://strapi.example.com",
        syncDirection: "BIDIRECTIONAL",
        enabledSyncTypes: ["PRODUCTS", "CUSTOMERS"],
        autoSync: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        strapiConfig: {
          strapiUrl: "https://strapi.example.com",
          webhooksEnabled: true,
          contentTypes: ["api::product.product"],
          strapiVersion: "4.15.0",
        },
      };

      // First call check existing (null), second call toResponse (mockConn)
      mockPrismaClient.ecommerceConnection.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockConn);

      mockPrismaClient.ecommerceConnection.create.mockResolvedValue(mockConn);

      const result = await useCase.create("org-1", {
        name: "Safe Strapi",
        strapiUrl: "https://strapi.example.com",
        apiToken: "token-123",
      });

      expect(isSafeUrl).toHaveBeenCalledWith("https://strapi.example.com");
      expect(mockStrapiProvider.ping).toHaveBeenCalled();
      expect(result.id).toBe("conn-1");
    });
  });

  describe("update", () => {
    it("should throw BadRequestException when updating to an unsafe/internal URL (SSRF protection)", async () => {
      mockPrismaClient.ecommerceConnection.findFirst.mockResolvedValue({
        id: "conn-1",
        organizationId: "org-1",
        platform: "STRAPI",
      });
      mockPrismaClient.strapiConnectionConfig.findUnique.mockResolvedValue({
        strapiUrl: "https://strapi.example.com",
        apiToken: "token-123",
      });

      vi.mocked(isSafeUrl).mockResolvedValue(false);

      await expect(
        useCase.update("org-1", "conn-1", {
          strapiUrl: "http://127.0.0.1:6379",
        }),
      ).rejects.toThrow(BadRequestException);

      expect(isSafeUrl).toHaveBeenCalledWith("http://127.0.0.1:6379");
      expect(mockStrapiProvider.ping).not.toHaveBeenCalled();
    });
  });
});
