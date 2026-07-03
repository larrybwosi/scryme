import { Test, TestingModule } from "@nestjs/testing";
import { BakeryService } from "../bakery.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "../../../auth/auth.service";

describe("BakeryService", () => {
  let service: BakeryService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      batch: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
        count: vi.fn(),
      },
      recipe: {
        count: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      productVariantStock: {
        findMany: vi.fn(),
        fields: {
          reorderPoint: "reorderPoint",
        },
      },
      bakeryBaker: {
        count: vi.fn(),
      },
      bakeryCategory: {
        findMany: vi.fn(),
      },
    },
  };

  const mockAuthService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BakeryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<BakeryService>(BakeryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getBakeryOverview", () => {
    it("should return correct overview data", async () => {
      const mockCtx = { organizationId: "org-1" } as any;

      mockPrisma.client.batch.findMany.mockResolvedValue([
        {
          id: "b1",
          batchNumber: "BAT-1",
          status: "PLANNED",
          scheduledStartAt: new Date(),
          recipe: { id: "r1", name: "Bread" },
          leadBaker: { member: { user: { name: "John" } } },
        },
      ]);
      mockPrisma.client.recipe.count.mockResolvedValue(5);
      mockPrisma.client.bakeryBaker.count.mockResolvedValue(2);
      mockPrisma.client.productVariantStock.findMany
        // inventoryValueData
        .mockResolvedValueOnce([
          { availableStock: 10, variant: { buyingPrice: 5 } },
          { availableStock: 5, variant: { buyingPrice: 20 } },
        ])
        // lowStockItemsData
        .mockResolvedValueOnce([
          {
            id: "s1",
            availableStock: 2,
            reorderPoint: 5,
            reorderQty: 10,
            variant: { name: "Flour", sku: "F-1", baseUnit: { symbol: "kg" } },
          },
        ])
        // stockDataQuery
        .mockResolvedValueOnce([
          {
            id: "s1",
            availableStock: 2,
            reorderPoint: 5,
            reorderQty: 10,
            variant: { name: "Flour", sku: "F-1", baseUnit: { symbol: "kg" } },
          },
        ]);

      mockPrisma.client.recipe.aggregate.mockResolvedValue({ _avg: { costPrice: 15 } });
      mockPrisma.client.recipe.groupBy.mockResolvedValue([
        { categoryId: "c1", _count: { _all: 3 } },
        { categoryId: null, _count: { _all: 2 } },
      ]);
      mockPrisma.client.batch.groupBy.mockResolvedValue([
        { status: "PLANNED", _count: { _all: 10 } },
        { status: "IN_PROGRESS", _count: { _all: 2 } },
      ]);
      mockPrisma.client.batch.count.mockResolvedValue(5);
      mockPrisma.client.bakeryCategory.findMany.mockResolvedValue([{ id: "c1", name: "Bakery" }]);

      const result = await service.getBakeryOverview(mockCtx);

      expect(result.recipesCount).toBe(5);
      expect(result.bakersCount).toBe(2);
      expect(result.totalInventoryValue).toBe(150); // (10*5) + (5*20)
      expect(result.lowStockIngredients).toHaveLength(1);
      expect(result.lowStockIngredients[0].name).toBe("Flour");
      expect(result.recipesByCategory["Bakery"]).toBe(3);
      expect(result.recipesByCategory["Uncategorized"]).toBe(2);
      expect(result.summary.totalBatches).toBe(12);
      expect(result.summary.activeBatches).toBe(2);
      expect(result.summary.completedToday).toBe(5);
    });
  });

  describe("getProductionStats", () => {
    it("should calculate production stats correctly", async () => {
      const orgId = "org-1";
      const start = new Date("2023-01-01");
      const end = new Date("2023-01-31");

      const mockAggregation = {
        _count: { _all: 3 },
        _sum: { wasteQuantity: 3.5 },
      };

      const mockGroups = [
        {
          recipeId: "r1",
          _sum: { actualQuantity: 25, wasteQuantity: 3 },
        },
        {
          recipeId: "r2",
          _sum: { actualQuantity: 20, wasteQuantity: 0.5 },
        },
      ];

      const mockRecipes = [
        {
          id: "r1",
          name: "Bread",
          systemUnit: { symbol: "kg" },
        },
        {
          id: "r2",
          name: "Cake",
          orgUnit: { symbol: "pcs" },
        },
      ];

      mockPrisma.client.batch.aggregate.mockResolvedValue(mockAggregation);
      mockPrisma.client.batch.groupBy.mockResolvedValue(mockGroups);
      mockPrisma.client.recipe.findMany.mockResolvedValue(mockRecipes);

      const result = await service.getProductionStats(orgId, start, end);

      expect(result.totalBatches).toBe(3);
      expect(result.totalWaste).toBe(3.5);
      expect(result.recipeStats).toHaveLength(2);

      const breadStats = result.recipeStats.find(s => s.name === "Bread");
      expect(breadStats.quantity).toBe(25);
      expect(breadStats.waste).toBe(3);
      expect(breadStats.unit).toBe("kg");

      const cakeStats = result.recipeStats.find(s => s.name === "Cake");
      expect(cakeStats.quantity).toBe(20);
      expect(cakeStats.waste).toBe(0.5);
      expect(cakeStats.unit).toBe("pcs");

      expect(result.topRecipes[0].name).toBe("Bread");
    });

    it("should handle no batches", async () => {
      mockPrisma.client.batch.aggregate.mockResolvedValue({
        _count: { _all: 0 },
        _sum: { wasteQuantity: null },
      });
      mockPrisma.client.batch.groupBy.mockResolvedValue([]);
      mockPrisma.client.recipe.findMany.mockResolvedValue([]);

      const result = await service.getProductionStats("org-1", new Date(), new Date());
      expect(result.totalBatches).toBe(0);
      expect(result.totalWaste).toBe(0);
      expect(result.recipeStats).toHaveLength(0);
      expect(result.topRecipes).toHaveLength(0);
    });
  });
});
