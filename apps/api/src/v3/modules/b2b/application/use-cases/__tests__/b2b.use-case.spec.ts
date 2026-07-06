import { Test, TestingModule } from "@nestjs/testing";
import { B2BUseCase } from "../b2b.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { Decimal } from "decimal.js";

describe("B2BUseCase", () => {
  let useCase: B2BUseCase;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      product: {
        findMany: vi.fn(),
      },
      transaction: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      businessAccount: {
        findFirst: vi.fn(),
      },
      inventoryLocation: {
        findFirst: vi.fn(),
      },
      productVariant: {
        findMany: vi.fn(),
      },
      productVariantStock: {
        findMany: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        B2BUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<B2BUseCase>(B2BUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getCatalog", () => {
    it("should return products in catalog with categoryName mapping", async () => {
      const mockProducts = [
        {
          id: "prod_1",
          name: "Product 1",
          description: "Desc 1",
          category: { id: "cat_1", name: "Category 1" },
          variants: [
            {
              id: "var_1",
              name: "Variant 1",
              sku: "SKU-1",
              variantStocks: [{ availableStock: new Decimal(10), locationId: "loc_1" }],
            },
          ],
        },
      ];

      mockPrismaService.client.product.findMany.mockResolvedValue(mockProducts);

      const result = await useCase.getCatalog("org_1", "ba_1");

      expect(result[0]).toHaveProperty("categoryName", "Category 1");
      expect(mockPrismaService.client.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            category: expect.any(Object),
            variants: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("getInvoices", () => {
    it("should return transactions of type POS_SALE", async () => {
      const mockInvoices = [
        { id: "tx_1", number: "INV-1", type: "POS_SALE" },
      ];
      mockPrismaService.client.transaction.findMany.mockResolvedValue(mockInvoices);

      const result = await useCase.getInvoices("org_1", "ba_1");

      expect(result).toEqual(mockInvoices);
    });
  });

  describe("getOrders", () => {
    it("should return transactions of type SALES_ORDER with items included", async () => {
      const mockOrders = [
        { id: "tx_2", number: "ORD-1", type: "SALES_ORDER", items: [] },
      ];
      mockPrismaService.client.transaction.findMany.mockResolvedValue(mockOrders);

      const result = await useCase.getOrders("org_1", "ba_1");

      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.client.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { items: true },
        })
      );
    });
  });
});
