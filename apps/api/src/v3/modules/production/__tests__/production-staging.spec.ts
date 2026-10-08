import { MovementType } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import { ProductionService } from "../application/services/production.service";
import { ProductionReportService } from "../reports/production-report.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V3AuthCoreService } from "@/v3/modules/auth-core/infrastructure/services/v3-auth-core.service";
import { BadRequestException } from "@nestjs/common";
import { describe, beforeEach, it, expect, vi } from "vitest";

describe("ProductionService - Staging & Dispatching", () => {
  let service: ProductionService;
  let prismaMock: any;

  const mockCtx: any = {
    organizationId: "org-1",
    memberId: "member-1",
    locationId: "kitchen-loc-1",
  };

  beforeEach(async () => {
    prismaMock = {
      client: {
        batch: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
          findMany: vi.fn(),
          update: vi.fn(),
        },
        bakerySettings: {
          findUnique: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        batchDispatch: {
          create: vi.fn(),
        },
        productVariantStock: {
          upsert: vi.fn(),
          updateMany: vi.fn(),
        },
        stockBatch: {
          create: vi.fn(),
          findMany: vi.fn(),
        },
        stockMovement: {
          create: vi.fn(),
          createMany: vi.fn(),
        },
        batchIngredientConsumption: {
          createMany: vi.fn(),
        },
        $transaction: vi.fn(async (cb) => cb(prismaMock.client)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: V3AuthCoreService, useValue: {} },
        { provide: ProductionReportService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  describe("completeBatch with Staging", () => {
    it("should set staging status to STAGED when enableProductionStaging is true", async () => {
      prismaMock.client.batch.findUnique.mockResolvedValue({
        id: "batch-1",
        batchNumber: "BAT-001",
        recipe: { id: "recipe-1", producesVariantId: "var-1", producesVariant: { id: "var-1", productId: "prod-1" } },
      });
      prismaMock.client.bakerySettings.findUnique.mockResolvedValue({
        enableProductionStaging: true,
      });
      prismaMock.client.batch.update.mockResolvedValue({
        id: "batch-1",
        status: "COMPLETED",
        stagedQuantity: 100,
        dispatchedQuantity: 0,
        stagingStatus: "STAGED",
      });
      prismaMock.client.stockBatch.create.mockResolvedValue({ id: "sb-1" });

      const result = await service.completeBatch(mockCtx, "batch-1", {
        actualQuantity: 100,
        wasteQuantity: 0,
      });

      expect(prismaMock.client.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stagedQuantity: 100,
            stagingStatus: "STAGED",
          }),
        }),
      );
      expect(result.stagingStatus).toBe("STAGED");
    });

    it("should set staging status to NOT_STAGED when enableProductionStaging is false", async () => {
      prismaMock.client.batch.findUnique.mockResolvedValue({
        id: "batch-1",
        batchNumber: "BAT-001",
        recipe: { id: "recipe-1", producesVariantId: "var-1", producesVariant: { id: "var-1", productId: "prod-1" } },
      });
      prismaMock.client.bakerySettings.findUnique.mockResolvedValue({
        enableProductionStaging: false,
      });
      prismaMock.client.batch.update.mockResolvedValue({
        id: "batch-1",
        status: "COMPLETED",
        stagingStatus: "NOT_STAGED",
      });
      prismaMock.client.stockBatch.create.mockResolvedValue({ id: "sb-1" });

      const result = await service.completeBatch(mockCtx, "batch-1", {
        actualQuantity: 100,
        wasteQuantity: 0,
      });

      expect(prismaMock.client.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stagingStatus: "NOT_STAGED",
          }),
        }),
      );
      expect(result.stagingStatus).toBe("NOT_STAGED");
    });
  });

  describe("dispatchStagedBatch", () => {
    it("should throw BadRequestException if requested quantity exceeds available staged quantity", async () => {
      prismaMock.client.batch.findFirst.mockResolvedValue({
        id: "batch-1",
        batchNumber: "BAT-001",
        status: "COMPLETED",
        stagedQuantity: 50,
        dispatchedQuantity: 30,
        stagingWasteQuantity: 0,
        recipe: { producesVariantId: "var-1" },
      });

      await expect(
        service.dispatchStagedBatch(mockCtx, "batch-1", {
          toLocationId: "front-office-loc",
          quantity: 25, // Available is 20
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should dispatch staged items to front office and update POS stock", async () => {
      prismaMock.client.batch.findFirst.mockResolvedValue({
        id: "batch-1",
        batchNumber: "BAT-001",
        status: "COMPLETED",
        stagedQuantity: 50,
        dispatchedQuantity: 10,
        stagingWasteQuantity: 0,
        recipe: { producesVariantId: "var-1", producesVariant: { productId: "prod-1" }, costPrice: 10 },
      });

      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "front-office-loc",
        name: "Front Counter Shop",
      });

      prismaMock.client.batch.update.mockResolvedValue({
        id: "batch-1",
        dispatchedQuantity: 30,
        stagingStatus: "PARTIALLY_DISPATCHED",
      });

      prismaMock.client.batchDispatch.create.mockResolvedValue({
        id: "dispatch-1",
        quantity: 20,
      });

      prismaMock.client.stockBatch.create.mockResolvedValue({ id: "fo-sb-1" });

      const result = await service.dispatchStagedBatch(mockCtx, "batch-1", {
        toLocationId: "front-office-loc",
        quantity: 20,
        notes: "Morning shift delivery",
      });

      expect(prismaMock.client.batchDispatch.create).toHaveBeenCalledWith({
        data: {
          batchId: "batch-1",
          toLocationId: "front-office-loc",
          quantity: 20,
          dispatchedById: "member-1",
          notes: "Morning shift delivery",
          organizationId: "org-1",
        },
      });

      expect(prismaMock.client.productVariantStock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            variantId_locationId: {
              variantId: "var-1",
              locationId: "front-office-loc",
            },
          },
          update: {
            currentStock: { increment: 20 },
            availableStock: { increment: 20 },
          },
        }),
      );


      expect(prismaMock.client.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: MovementType.TRANSFER,
          }),
        }),
      );
      expect(result.dispatchLog.id).toBe("dispatch-1");
    });
  });

  describe("disposeStagedStock", () => {
    it("should record waste and update staged waste quantity", async () => {
      prismaMock.client.batch.findFirst.mockResolvedValue({
        id: "batch-1",
        batchNumber: "BAT-001",
        status: "COMPLETED",
        stagedQuantity: 50,
        dispatchedQuantity: 30,
        stagingWasteQuantity: 5,
        stagingStatus: "PARTIALLY_DISPATCHED",
        recipe: { producesVariantId: "var-1" },
        outputLocationId: "kitchen-loc-1",
      });

      prismaMock.client.batch.update.mockResolvedValue({
        id: "batch-1",
        stagingWasteQuantity: 10,
        stagingStatus: "PARTIALLY_DISPATCHED",
      });

      const result = await service.disposeStagedStock(mockCtx, "batch-1", {
        quantity: 5,
        reason: "Burnt bottom",
      });

      expect(prismaMock.client.batch.update).toHaveBeenCalledWith({
        where: { id: "batch-1" },
        data: {
          stagingWasteQuantity: 10,
          stagingStatus: "PARTIALLY_DISPATCHED",
        },
      });

      expect(prismaMock.client.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: MovementType.ADJUSTMENT_OUT,
          }),
        }),
      );
      expect(result.stagingWasteQuantity).toBe(10);
    });
  });
});
