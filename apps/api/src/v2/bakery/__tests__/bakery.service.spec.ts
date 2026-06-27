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
      },
      recipe: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      bakeryBaker: {
        count: vi.fn(),
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

      const result = await service.getProductionStats(
        "org-1",
        new Date(),
        new Date(),
      );
      expect(result.totalBatches).toBe(0);
      expect(result.totalWaste).toBe(0);
      expect(result.recipeStats).toHaveLength(0);
      expect(result.topRecipes).toHaveLength(0);
    });
  });
});
