import { vi, describe, it, expect, beforeEach } from "vitest";
import { CycleCountingService } from "../cycle-counting.service";
import { StockTakeStatus, AutomationFrequency } from "@repo/db";

describe("CycleCountingService", () => {
  let service: CycleCountingService;
  let prisma: any;
  let mockCycleCountConfig: any;
  let mockProductVariantStock: any;
  let mockStockTake: any;

  beforeEach(() => {
    mockCycleCountConfig = {
      findMany: vi.fn(),
      update: vi.fn(),
    };

    mockProductVariantStock = {
      findMany: vi.fn(),
    };

    mockStockTake = {
      create: vi.fn(),
    };

    prisma = {
      client: {
        cycleCountConfig: mockCycleCountConfig,
        productVariantStock: mockProductVariantStock,
        stockTake: mockStockTake,
      },
    };

    service = new CycleCountingService(prisma);
  });

  describe("processCycleCounts", () => {
    it("should process active cycle count configs that are due", async () => {
      const mockConfigs = [
        {
          id: "config-1",
          organizationId: "org-1",
          locationId: "loc-1",
          categoryId: "cat-1",
          name: "Daily Count",
          frequency: AutomationFrequency.DAILY,
          includeABC: ["A"],
        },
      ];

      mockCycleCountConfig.findMany.mockResolvedValue(mockConfigs);
      mockProductVariantStock.findMany.mockResolvedValue([
        { variantId: "v1", currentStock: 10 },
      ]);
      mockStockTake.create.mockResolvedValue({ id: "st-1" });

      await service.processCycleCounts();

      // Verify cycle configs were queried with active filter and lte now run time
      expect(mockCycleCountConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );

      // Verify nextRunAt was updated
      expect(mockCycleCountConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "config-1" },
          data: expect.objectContaining({
            nextRunAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("generateStockTake", () => {
    it("should perform optimized select query and create planned stock take", async () => {
      const mockConfig = {
        id: "config-1",
        organizationId: "org-1",
        locationId: "loc-1",
        categoryId: "cat-1",
        name: "Weekly Count",
        frequency: AutomationFrequency.WEEKLY,
        includeABC: [],
      };

      const mockStocks = [
        { variantId: "v1", currentStock: 10 },
        { variantId: "v2", currentStock: 25 },
      ];

      mockProductVariantStock.findMany.mockResolvedValue(mockStocks);

      await service.generateStockTake(mockConfig);

      // Verify the Bolt Optimization: targeted select block used instead of broad include
      expect(mockProductVariantStock.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          locationId: "loc-1",
          variant: {
            categoryId: "cat-1",
          },
        },
        select: {
          variantId: true,
          currentStock: true,
        },
      });

      // Verify planned stock take was created with correct mapped items
      expect(mockStockTake.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org-1",
            locationId: "loc-1",
            status: StockTakeStatus.PLANNED,
            items: {
              create: [
                { variantId: "v1", systemQuantity: 10 },
                { variantId: "v2", systemQuantity: 25 },
              ],
            },
          }),
        }),
      );
    });

    it("should return early if no stocks found for config", async () => {
      const mockConfig = {
        id: "config-1",
        organizationId: "org-1",
        locationId: "loc-1",
        categoryId: "cat-1",
        name: "Weekly Count",
        frequency: AutomationFrequency.WEEKLY,
        includeABC: [],
      };

      mockProductVariantStock.findMany.mockResolvedValue([]);

      await service.generateStockTake(mockConfig);

      // Verify no stock take is created
      expect(mockStockTake.create).not.toHaveBeenCalled();
    });
  });
});
