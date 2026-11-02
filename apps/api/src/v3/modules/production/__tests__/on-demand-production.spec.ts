import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductionService } from "../application/services/production.service";
import { ProductionProjectionService } from "../application/services/production-projection.service";
import { ProductionRunType } from "@repo/db";
import { Decimal } from "decimal.js";

describe("On-Demand Production Workflow & Projections", () => {
  let productionService: ProductionService;
  let projectionService: ProductionProjectionService;

  const mockPrisma: any = {
    client: {
      recipe: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      productVariantStock: {
        findMany: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      supplier: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
      },
      batch: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      project: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      bakeryBaker: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      systemUnit: {
        findUnique: vi.fn(),
      },
      organizationUnit: {
        findFirst: vi.fn(),
      },
      bakerySettings: {
        findUnique: vi.fn(),
      },
      transaction: {
        findFirst: vi.fn(),
      },
      stockBatch: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma.client)),
    },
  };

  const mockTaskUseCase: any = {
    createTask: vi.fn().mockResolvedValue({ id: "task-101", taskKey: "BAKERY-1" }),
    updateTask: vi.fn().mockResolvedValue({ id: "task-101", status: "DONE" }),
  };

  const mockWhatsappService: any = {
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
  };

  const mockRealtimeService: any = {
    publish: vi.fn().mockResolvedValue(true),
  };

  const mockFirebaseMessagingService: any = {
    sendToOrganization: vi.fn().mockResolvedValue({ successCount: 1 }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    productionService = new ProductionService(
      mockPrisma,
      {} as any,
      mockTaskUseCase,
      mockWhatsappService,
      mockRealtimeService,
      mockFirebaseMessagingService,
    );

    projectionService = new ProductionProjectionService(mockPrisma);
  });

  describe("calculateIngredientProjections", () => {
    it("should calculate shortages, supplier lead times, and projected costs correctly", async () => {
      mockPrisma.client.recipe.findFirst.mockResolvedValue({
        id: "recipe-cake",
        name: "Custom Celebration Cake",
        yieldQuantity: new Decimal(1),
        totalTime: 90,
        ingredients: [
          {
            ingredientVariantId: "var-flour",
            quantity: new Decimal(2),
            ingredientVariant: {
              name: "Cake Flour",
              sku: "FLR-01",
              buyingPrice: new Decimal(50),
              reorderRules: [{ leadTimeDays: 2, preferredSupplierId: "sup-1" }],
            },
            systemUnit: { symbol: "kg" },
          },
          {
            ingredientVariantId: "var-sugar",
            quantity: new Decimal(1),
            ingredientVariant: {
              name: "Caster Sugar",
              sku: "SGR-01",
              buyingPrice: new Decimal(100),
              reorderRules: [{ leadTimeDays: 5, preferredSupplierId: "sup-2" }],
            },
            systemUnit: { symbol: "kg" },
          },
        ],
      });

      mockPrisma.client.productVariantStock.findMany.mockResolvedValue([
        { variantId: "var-flour", availableStock: new Decimal(5) },
        { variantId: "var-sugar", availableStock: new Decimal(0.2) },
      ]);

      const result = await projectionService.calculateIngredientProjections("org-1", "recipe-cake", 1);

      expect(result.recipeName).toBe("Custom Celebration Cake");
      expect(result.hasSufficientStock).toBe(false);
      expect(result.maxLeadTimeDays).toBe(5);
      expect(result.ingredients).toHaveLength(2);

      const flour = result.ingredients.find((i) => i.variantId === "var-flour");
      expect(flour?.shortageQuantity).toBe(0);

      const sugar = result.ingredients.find((i) => i.variantId === "var-sugar");
      expect(sugar?.shortageQuantity).toBe(0.8);
      expect(sugar?.projectedCost).toBe(80);
      expect(result.totalShortageCost).toBe(80);
    });
  });

  describe("createBatch on-demand with tasks and realtime", () => {
    it("should auto-create a project task and emit realtime event for on-demand batch", async () => {
      mockPrisma.client.systemUnit.findUnique.mockResolvedValue({ id: "sys-kg" });
      mockPrisma.client.bakerySettings.findUnique.mockResolvedValue({ batchPrefix: "BAT" });
      mockPrisma.client.batch.count.mockResolvedValue(10);
      mockPrisma.client.project.findFirst.mockResolvedValue({ id: "proj-bakery", key: "BAKERY" });
      mockPrisma.client.recipe.findUnique.mockResolvedValue({
        id: "recipe-cake",
        name: "Custom Celebration Cake",
        totalTime: 120,
      });

      mockPrisma.client.batch.create.mockResolvedValue({
        id: "batch-101",
        batchNumber: "BAT-11",
        runType: ProductionRunType.ON_DEMAND,
        orderReference: "POS-9001",
        taskId: "task-101",
        scheduledStartAt: new Date(),
      });

      const batch = await productionService.createBatch("org-1", {
        recipeId: "recipe-cake",
        plannedQuantity: 1,
        systemUnitId: "sys-kg",
        runType: ProductionRunType.ON_DEMAND,
        orderReference: "POS-9001",
        autoCreateTask: true,
      });

      expect(mockTaskUseCase.createTask).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({
          projectId: "proj-bakery",
          title: expect.stringContaining("[On-Demand] Custom Celebration Cake"),
          priority: "HIGH",
        }),
      );

      expect(mockRealtimeService.publish).toHaveBeenCalledWith(
        "production:org:org-1",
        "batch:created",
        expect.objectContaining({
          batchId: "batch-101",
          orderReference: "POS-9001",
        }),
      );

      expect(batch.runType).toBe(ProductionRunType.ON_DEMAND);
    });
  });

  describe("completeBatch multi-channel notifications", () => {
    it("should mark task as DONE, emit realtime events, push FCM, and send WhatsApp to customer", async () => {
      const mockBatch = {
        id: "batch-101",
        batchNumber: "BAT-11",
        runType: ProductionRunType.ON_DEMAND,
        orderReference: "POS-9001",
        taskId: "task-101",
        recipe: { name: "Custom Celebration Cake", producesVariantId: "prod-1", producesVariant: { productId: "p-1" } },
        outputLocationId: "loc-1",
      };

      mockPrisma.client.batch.findUnique.mockResolvedValue(mockBatch);
      mockPrisma.client.batch.update.mockResolvedValue({
        ...mockBatch,
        actualQuantity: new Decimal(1),
        status: "COMPLETED",
      });
      mockPrisma.client.stockBatch.create.mockResolvedValue({ id: "sb-out" });
      mockPrisma.client.stockMovement.create.mockResolvedValue({ id: "sm-out" });

      mockPrisma.client.transaction.findFirst.mockResolvedValue({
        number: "POS-9001",
        customer: { name: "John Doe", phone: "+254712345678" },
      });

      const ctx: any = { organizationId: "org-1", memberId: "mem-1", locationId: "loc-1" };

      await productionService.completeBatch(ctx, "batch-101", {
        actualQuantity: 1,
        wasteQuantity: 0,
      });

      // Linked task updated
      expect(mockTaskUseCase.updateTask).toHaveBeenCalledWith("org-1", "task-101", { status: "DONE" });

      // Realtime emitted to production, POS, and order channel
      expect(mockRealtimeService.publish).toHaveBeenCalledWith(
        "production:org:org-1",
        "batch:completed",
        expect.objectContaining({ batchId: "batch-101" }),
      );
      expect(mockRealtimeService.publish).toHaveBeenCalledWith(
        "pos:org:org-1",
        "production:batch:completed",
        expect.objectContaining({ batchId: "batch-101" }),
      );
      expect(mockRealtimeService.publish).toHaveBeenCalledWith(
        "order:POS-9001",
        "production:batch:completed",
        expect.objectContaining({ batchId: "batch-101" }),
      );

      // FCM push dispatched
      expect(mockFirebaseMessagingService.sendToOrganization).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({
          title: "Batch Completed: BAT-11",
        }),
      );

      // WhatsApp customer notification dispatched
      expect(mockWhatsappService.sendMessage).toHaveBeenCalledWith(
        "org-1",
        "mem-1",
        expect.objectContaining({
          recipientPhone: "+254712345678",
          text: expect.stringContaining("is freshly prepared and ready for pickup"),
        }),
      );
    });
  });
});
