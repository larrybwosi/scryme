import { describe, it, expect, beforeEach, vi } from "vitest";
import { FavoritesUseCase } from "../favorites.use-case";
import { PrismaService } from "@/prisma/prisma.service";

describe("FavoritesUseCase", () => {
  let useCase: FavoritesUseCase;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        favorite: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          delete: vi.fn(),
        },
        product: {
          findFirst: vi.fn(),
        },
      },
    } as any;

    useCase = new FavoritesUseCase(prisma);
  });

  it("should add a favorite", async () => {
    const orgId = "org-1";
    const dto = { productId: "prod-1", customerId: "cust-1" };

    vi.mocked(prisma.client.product.findFirst).mockResolvedValue({
      id: "prod-1",
    } as any);
    vi.mocked(prisma.client.favorite.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.client.favorite.create).mockResolvedValue({
      id: "fav-1",
    } as any);

    const result = await useCase.addFavorite(orgId, dto);

    expect(result).toBeDefined();
    expect(prisma.client.favorite.create).toHaveBeenCalled();
  });

  it("should get favorites with optimized select", async () => {
    const orgId = "org-1";
    const customerId = "cust-1";
    const favorites = [
      {
        id: "fav-1",
        productId: "prod-1",
        customerId: "cust-1",
        organizationId: "org-1",
        createdAt: new Date(),
        product: {
          id: "prod-1",
          name: "Product 1",
          sku: "SKU-1",
          imageUrls: ["img1.jpg"],
          categoryId: "cat-1",
          category: { id: "cat-1", name: "Category 1" },
          variants: [
            {
              id: "var-1",
              name: "Variant 1",
              sku: "SKU-1-V1",
              retailPrice: 100,
              buyingPrice: 80,
            },
          ],
        },
      },
    ];

    vi.mocked(prisma.client.favorite.findMany).mockResolvedValue(favorites as any);

    const result = await useCase.getFavorites(orgId, customerId);

    expect(result).toEqual(favorites);
    expect(prisma.client.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, customerId },
        select: expect.objectContaining({
          product: expect.objectContaining({
            select: expect.objectContaining({
              name: true,
              sku: true,
              variants: expect.any(Object),
            }),
          }),
        }),
      }),
    );
  });
});
