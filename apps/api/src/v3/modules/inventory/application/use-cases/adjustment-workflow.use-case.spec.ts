import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApproveStockAdjustmentUseCase, RejectStockAdjustmentUseCase } from "./adjustment-workflow.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Decimal } from "decimal.js";

describe("Adjustment Workflow Use Cases", () => {
  let prisma: any;
  let inventoryMovementService: any;
  let approveUseCase: ApproveStockAdjustmentUseCase;
  let rejectUseCase: RejectStockAdjustmentUseCase;

  beforeEach(() => {
    prisma = {
      client: {
        stockAdjustment: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        productVariant: {
          findUnique: vi.fn(),
        },
        productVariantStock: {
          upsert: vi.fn(),
        },
        stockBatch: {
          update: vi.fn(),
        },
        approvalRequest: {
          updateMany: vi.fn(),
        },
        $transaction: vi.fn(cb => cb(prisma.client)),
      },
    };

    inventoryMovementService = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };

    approveUseCase = new ApproveStockAdjustmentUseCase(prisma, inventoryMovementService);
    rejectUseCase = new RejectStockAdjustmentUseCase(prisma);
  });

  describe("ApproveStockAdjustmentUseCase", () => {
    it("should successfully approve a pending stock adjustment using pre-fetched productId", async () => {
      const adjustment = {
        id: "adj-1",
        organizationId: "org-1",
        memberId: "member-1",
        variantId: "variant-1",
        locationId: "loc-1",
        quantity: new Decimal(10),
        reason: "FOUND",
        status: "PENDING",
        stockBatchId: "batch-1",
        notes: "Some notes",
        variant: {
          id: "variant-1",
          productId: "prod-1",
        },
      };

      prisma.client.stockAdjustment.findUnique.mockResolvedValue(adjustment);
      prisma.client.stockAdjustment.update.mockResolvedValue({ ...adjustment, status: "APPROVED" });

      const result = await approveUseCase.execute("org-1", "approver-1", "adj-1");

      expect(result.status).toBe("APPROVED");
      expect(prisma.client.stockAdjustment.findUnique).toHaveBeenCalledWith({
        where: { id: "adj-1", organizationId: "org-1" },
        include: { variant: true },
      });

      // Verify ProductVariantStock upsert uses pre-fetched productId and variant.findUnique is NOT called at all
      expect(prisma.client.productVariantStock.upsert).toHaveBeenCalledWith({
        where: {
          variantId_locationId: {
            variantId: "variant-1",
            locationId: "loc-1",
          },
        },
        create: {
          organizationId: "org-1",
          productId: "prod-1",
          variantId: "variant-1",
          locationId: "loc-1",
          currentStock: adjustment.quantity,
          availableStock: adjustment.quantity,
        },
        update: {
          currentStock: { increment: adjustment.quantity },
          availableStock: { increment: adjustment.quantity },
        },
      });

      expect(prisma.client.productVariant.findUnique).not.toHaveBeenCalled();

      // Verify other downstream calls
      expect(prisma.client.stockBatch.update).toHaveBeenCalledWith({
        where: { id: "batch-1" },
        data: { currentQuantity: { increment: adjustment.quantity } },
      });

      expect(inventoryMovementService.recordMovement).toHaveBeenCalledWith(prisma.client, {
        organizationId: "org-1",
        memberId: "member-1",
        variantId: "variant-1",
        quantity: 10,
        fromLocationId: null,
        toLocationId: "loc-1",
        movementType: "ADJUSTMENT_IN",
        stockBatchId: "batch-1",
        referenceId: "adj-1",
        referenceType: "StockAdjustment",
        notes: "Some notes",
      });

      expect(prisma.client.approvalRequest.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          relatedId: "adj-1",
          requestType: "STOCK_ADJUSTMENT",
        },
        data: {
          status: "APPROVED",
        },
      });
    });

    it("should throw NotFoundException if adjustment request is not found", async () => {
      prisma.client.stockAdjustment.findUnique.mockResolvedValue(null);

      await expect(
        approveUseCase.execute("org-1", "approver-1", "adj-999")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if adjustment is not PENDING", async () => {
      prisma.client.stockAdjustment.findUnique.mockResolvedValue({
        id: "adj-1",
        organizationId: "org-1",
        status: "APPROVED",
      });

      await expect(
        approveUseCase.execute("org-1", "approver-1", "adj-1")
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("RejectStockAdjustmentUseCase", () => {
    it("should successfully reject a pending stock adjustment", async () => {
      const adjustment = {
        id: "adj-1",
        organizationId: "org-1",
        memberId: "member-1",
        variantId: "variant-1",
        locationId: "loc-1",
        quantity: new Decimal(5),
        reason: "WASTE",
        status: "PENDING",
        notes: "Expired",
      };

      prisma.client.stockAdjustment.findUnique.mockResolvedValue(adjustment);
      prisma.client.stockAdjustment.update.mockResolvedValue({ ...adjustment, status: "REJECTED" });

      const result = await rejectUseCase.execute("org-1", "approver-1", "adj-1", "damaged package");

      expect(result.status).toBe("REJECTED");
      expect(prisma.client.stockAdjustment.findUnique).toHaveBeenCalledWith({
        where: { id: "adj-1", organizationId: "org-1" },
      });

      expect(prisma.client.stockAdjustment.update).toHaveBeenCalledWith({
        where: { id: "adj-1" },
        data: {
          status: "REJECTED",
          approvedById: "approver-1",
          approvedAt: expect.any(Date),
          notes: "Expired\nRejected reason: damaged package",
        },
      });

      expect(prisma.client.approvalRequest.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          relatedId: "adj-1",
          requestType: "STOCK_ADJUSTMENT",
        },
        data: {
          status: "REJECTED",
        },
      });
    });

    it("should throw NotFoundException if adjustment is not found", async () => {
      prisma.client.stockAdjustment.findUnique.mockResolvedValue(null);

      await expect(
        rejectUseCase.execute("org-1", "approver-1", "adj-999")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if adjustment status is not PENDING", async () => {
      prisma.client.stockAdjustment.findUnique.mockResolvedValue({
        id: "adj-1",
        organizationId: "org-1",
        status: "REJECTED",
      });

      await expect(
        rejectUseCase.execute("org-1", "approver-1", "adj-1")
      ).rejects.toThrow(BadRequestException);
    });
  });
});
