import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import {
  RequestStockAdjustmentUseCase,
  ApproveStockAdjustmentUseCase,
  RejectStockAdjustmentUseCase,
} from "./adjustment-workflow.use-case";

vi.mock("@repo/shared/server", () => ({
  emitStockAdjustment: vi.fn().mockResolvedValue({}),
}));

describe("Stock Adjustment Security Hardening", () => {
  let prismaMock: any;
  let inventoryMovementServiceMock: any;
  let requestUseCase: RequestStockAdjustmentUseCase;
  let approveUseCase: ApproveStockAdjustmentUseCase;
  let rejectUseCase: RejectStockAdjustmentUseCase;

  const orgId = "org-1";
  const memberId = "mem-1";

  beforeEach(() => {
    prismaMock = {
      client: {
        productVariant: {
          findFirst: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        stockBatch: {
          findFirst: vi.fn(),
        },
        $transaction: vi.fn(async (cb) => cb(prismaMock.client)),
        stockAdjustment: {
          create: vi.fn(),
          findFirst: vi.fn(),
          update: vi.fn(),
        },
        approvalRequest: {
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        productVariantStock: {
          upsert: vi.fn(),
        },
      },
    };

    inventoryMovementServiceMock = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };

    requestUseCase = new RequestStockAdjustmentUseCase(prismaMock);
    approveUseCase = new ApproveStockAdjustmentUseCase(
      prismaMock,
      inventoryMovementServiceMock,
    );
    rejectUseCase = new RejectStockAdjustmentUseCase(prismaMock);
  });

  describe("RequestStockAdjustmentUseCase", () => {
    it("should throw NotFoundException if variant does not belong to organization", async () => {
      prismaMock.client.productVariant.findFirst.mockResolvedValue(null);
      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-1",
      });

      await expect(
        requestUseCase.execute(orgId, memberId, {
          variantId: "foreign-var",
          locationId: "loc-1",
          quantity: 5,
          reason: "ADJUSTMENT_IN",
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.productVariant.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-var", product: { organizationId: orgId } },
      });
    });

    it("should throw NotFoundException if location does not belong to organization", async () => {
      prismaMock.client.productVariant.findFirst.mockResolvedValue({
        id: "var-1",
      });
      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(
        requestUseCase.execute(orgId, memberId, {
          variantId: "var-1",
          locationId: "foreign-loc",
          quantity: 5,
          reason: "ADJUSTMENT_IN",
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.inventoryLocation.findFirst).toHaveBeenCalledWith(
        {
          where: { id: "foreign-loc", organizationId: orgId },
        },
      );
    });

    it("should throw NotFoundException if batch does not belong to organization", async () => {
      prismaMock.client.productVariant.findFirst.mockResolvedValue({
        id: "var-1",
      });
      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-1",
      });
      prismaMock.client.stockBatch.findFirst.mockResolvedValue(null);

      await expect(
        requestUseCase.execute(orgId, memberId, {
          variantId: "var-1",
          locationId: "loc-1",
          stockBatchId: "foreign-batch",
          quantity: 5,
          reason: "ADJUSTMENT_IN",
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.stockBatch.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-batch", organizationId: orgId },
      });
    });
  });

  describe("ApproveStockAdjustmentUseCase", () => {
    it("should enforce tenant scoping using findFirst", async () => {
      prismaMock.client.stockAdjustment.findFirst.mockResolvedValue(null);

      await expect(
        approveUseCase.execute(orgId, memberId, "adj-123"),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.stockAdjustment.findFirst).toHaveBeenCalledWith({
        where: { id: "adj-123", organizationId: orgId },
        include: { variant: { select: { productId: true } } },
      });
    });
  });

  describe("RejectStockAdjustmentUseCase", () => {
    it("should enforce tenant scoping using findFirst", async () => {
      prismaMock.client.stockAdjustment.findFirst.mockResolvedValue(null);

      await expect(
        rejectUseCase.execute(orgId, memberId, "adj-123"),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.stockAdjustment.findFirst).toHaveBeenCalledWith({
        where: { id: "adj-123", organizationId: orgId },
      });
    });
  });
});
