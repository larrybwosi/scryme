import { Test, TestingModule } from "@nestjs/testing";
import { ProductController } from "../product.controller";
import { GetProductsUseCase } from "../../../application/use-cases/get-products.use-case";
import { CreateProductUseCase } from "../../../application/use-cases/create-product.use-case";
import { ReviewPriceChangeUseCase } from "../../../application/use-cases/review-price-change.use-case";
import { PricingManagementService } from "../../../application/services/pricing-management.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ServiceManagementService } from "../../../../services/application/services/service-management.service";
import { RedisService } from "@/redis/redis.service";
import { AuditService } from "@/v3/common/services/audit.service";
import { Reflector } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ProductController.getVariants (V3)", () => {
  let controller: ProductController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: GetProductsUseCase, useValue: {} },
        { provide: CreateProductUseCase, useValue: {} },
        { provide: ReviewPriceChangeUseCase, useValue: {} },
        { provide: PricingManagementService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            client: {
              productVariant: {
                findMany: vi.fn(),
                count: vi.fn(),
              },
            },
          },
        },
        { provide: ServiceManagementService, useValue: {} },
        { provide: RedisService, useValue: { get: vi.fn(), setex: vi.fn() } },
        { provide: AuditService, useValue: { log: vi.fn() } },
        Reflector,
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should return paginated product variants with mapped properties", async () => {
    const mockVariants = [
      {
        id: "var_1",
        productId: "prod_1",
        name: "White Bread Sliced",
        sku: "WB-001",
        barcode: "123456789",
        retailPrice: "2.50",
        wholesalePrice: "2.00",
        buyingPrice: "1.20",
        isActive: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        product: {
          id: "prod_1",
          name: "White Bread",
          sku: "WB-001-PROD",
          type: "FINISHED_GOOD",
          categoryId: "cat_1",
          isActive: true,
          category: {
            id: "cat_1",
            name: "Breads",
          },
          defaultLocation: {
            id: "loc_1",
            name: "Main Bakery",
            address: { city: "Nairobi" },
          },
        },
        variantStocks: [
          {
            quantity: 50,
            location: {
              id: "loc_1",
              name: "Main Bakery",
              address: { city: "Nairobi" },
            },
          },
        ],
      },
    ];

    vi.mocked(prismaService.client.productVariant.findMany).mockResolvedValue(mockVariants as any);
    vi.mocked(prismaService.client.productVariant.count).mockResolvedValue(1);

    const mockReq = { organization: { id: "org_test" } };
    const query = { page: 1, limit: 20, productType: "FINISHED_GOOD", includeLocation: true };

    const result = await controller.getVariants(mockReq, query as any);

    expect(prismaService.client.productVariant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          product: expect.objectContaining({
            organizationId: "org_test",
            type: "FINISHED_GOOD",
          }),
        }),
      })
    );

    expect(result).toEqual({
      data: [
        {
          id: "var_1",
          productId: "prod_1",
          name: "White Bread Sliced",
          sku: "WB-001",
          barcode: "123456789",
          productType: "FINISHED_GOOD",
          retailPrice: 2.5,
          wholesalePrice: 2,
          buyingPrice: 1.2,
          costPrice: 1.2,
          stockQuantity: 50,
          isActive: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          category: {
            id: "cat_1",
            name: "Breads",
          },
          location: {
            id: "loc_1",
            name: "Main Bakery",
            address: { city: "Nairobi" },
          },
        },
      ],
      totalCount: 1,
      currentPage: 1,
      totalPages: 1,
      limit: 20,
    });
  });
});
