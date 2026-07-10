import { Test, TestingModule } from "@nestjs/testing";
import { FavoritesService } from "../favorites.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { vi, describe, it, expect, beforeEach } from "vitest";

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
});
