import { Test, TestingModule } from "@nestjs/testing";
import { FavoritesService } from "../favorites.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("FavoritesService", () => {
  let service: FavoritesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              favorite: {
                findMany: vi.fn(),
                upsert: vi.fn(),
                delete: vi.fn(),
                findUnique: vi.fn(),
              },
              product: {
                findFirst: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getFavorites", () => {
    it("should call findMany with select optimization", async () => {
      const ctx: V2ApiContext = { organizationId: "org1", customerId: "cust1" } as any;
      const mockFavorites = [
        {
          id: "fav1",
          productId: "prod1",
          product: {
            id: "prod1",
            name: "Product 1",
            sku: "SKU1",
            imageUrls: ["url1"],
            categoryId: "cat1",
            category: { id: "cat1", name: "Category 1" },
            variants: [
              {
                id: "var1",
                name: "Variant 1",
                sku: "SKU1-VAR1",
                retailPrice: 10,
                buyingPrice: 5,
                baseUnit: { id: "u1", symbol: "kg" },
                baseOrgUnit: null,
              },
            ],
          },
        },
      ];

      vi.spyOn(prisma.client.favorite, "findMany").mockResolvedValue(mockFavorites as any);

      const result = await service.getFavorites(ctx);

      expect(prisma.client.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org1", customerId: "cust1" },
          select: expect.anything(),
        }),
      );
      expect(result).toEqual(mockFavorites);
    });
  });

  describe("addFavorite", () => {
    it("should throw BadRequestException if customerId is missing", async () => {
      const ctx: V2ApiContext = { organizationId: "org1" } as any;
      await expect(service.addFavorite(ctx, "prod1")).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if the product does not exist or does not belong to the organization", async () => {
      const ctx: V2ApiContext = { organizationId: "org1", customerId: "cust1" } as any;
      vi.spyOn(prisma.client.product, "findFirst").mockResolvedValue(null);

      await expect(service.addFavorite(ctx, "prod1")).rejects.toThrow(NotFoundException);
      expect(prisma.client.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod1", organizationId: "org1" },
        select: { id: true },
      });
    });

    it("should call upsert on favorite if product exists and belongs to organization", async () => {
      const ctx: V2ApiContext = { organizationId: "org1", customerId: "cust1" } as any;
      vi.spyOn(prisma.client.product, "findFirst").mockResolvedValue({ id: "prod1" } as any);
      vi.spyOn(prisma.client.favorite, "upsert").mockResolvedValue({ id: "fav1" } as any);

      const result = await service.addFavorite(ctx, "prod1");

      expect(prisma.client.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod1", organizationId: "org1" },
        select: { id: true },
      });
      expect(prisma.client.favorite.upsert).toHaveBeenCalledWith({
        where: {
          customerId_productId: {
            customerId: "cust1",
            productId: "prod1",
          },
        },
        create: {
          organizationId: "org1",
          customerId: "cust1",
          productId: "prod1",
        },
        update: {},
      });
      expect(result).toEqual({ id: "fav1" });
    });
  });
});
