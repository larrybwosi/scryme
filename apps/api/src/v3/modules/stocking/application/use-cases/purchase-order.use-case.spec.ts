import { describe, it, expect, beforeEach, vi } from "vitest";
import { PurchaseOrderUseCase } from "./purchase-order.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PurchaseStatus } from "@repo/db";

describe("PurchaseOrderUseCase", () => {
  let useCase: PurchaseOrderUseCase;
  let prismaMock: any;
  let inventoryMovementServiceMock: any;
  let pricingManagementServiceMock: any;
  let accountingServiceMock: any;

  const mockOrgId = "org-123";
  const mockMemberId = "member-123";
  const mockPurchaseId = "purchase-123";
  const mockLocationId = "loc-123";

  beforeEach(() => {
    prismaMock = {
      client: {
        supplier: {
          findFirst: vi.fn(),
        },
        purchase: {
          findFirst: vi.fn(),
          update: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        $transaction: vi.fn((cb) => cb(prismaMock.tx)),
      },
      tx: {
        productVariant: {
          count: vi.fn(),
        },
        purchase: {
          findFirst: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        stockReceipt: {
          create: vi.fn(),
        },
        stockBatch: {
          create: vi.fn(),
          update: vi.fn(),
        },
        productVariantStock: {
          upsert: vi.fn(),
        },
        purchaseItem: {
          update: vi.fn(),
        },
      },
    };

    inventoryMovementServiceMock = {
      recordMovement: vi.fn().mockResolvedValue(undefined),
    };

    pricingManagementServiceMock = {
      handleCostChange: vi.fn().mockResolvedValue(undefined),
    };

    accountingServiceMock = {
      postPurchaseToLedger: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new PurchaseOrderUseCase(
      prismaMock as any,
      inventoryMovementServiceMock as any,
      pricingManagementServiceMock as any,
      accountingServiceMock as any,
    );
  });

  describe("create", () => {
    const createDto = {
      supplierId: "sup-123",
      items: [
        {
          variantId: "var-123",
          orderedQuantity: 5,
          unitCost: 10,
        },
      ],
    };

    it("should throw NotFoundException if supplier does not belong to organization", async () => {
      prismaMock.client.supplier.findFirst.mockResolvedValue(null);

      await expect(
        useCase.create(mockOrgId, mockMemberId, createDto as any),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "sup-123", organizationId: mockOrgId },
      });
    });

    it("should throw BadRequestException if any variant does not belong to organization", async () => {
      prismaMock.client.supplier.findFirst.mockResolvedValue({ id: "sup-123" });
      prismaMock.tx.productVariant.count.mockResolvedValue(0);

      await expect(
        useCase.create(mockOrgId, mockMemberId, createDto as any),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.tx.productVariant.count).toHaveBeenCalledWith({
        where: {
          id: { in: ["var-123"] },
          product: { organizationId: mockOrgId },
        },
      });
    });

    it("should create purchase order successfully when supplier and variants belong to organization", async () => {
      prismaMock.client.supplier.findFirst.mockResolvedValue({ id: "sup-123" });
      prismaMock.tx.productVariant.count.mockResolvedValue(1);
      prismaMock.tx.purchase.create.mockResolvedValue({
        id: mockPurchaseId,
        purchaseNumber: "PO-123",
        totalAmount: 50,
        currency: "KES",
        member: { user: { name: "Test User" } },
      });

      const result = await useCase.create(
        mockOrgId,
        mockMemberId,
        createDto as any,
      );

      expect(prismaMock.tx.purchase.create).toHaveBeenCalled();
      expect(result.id).toBe(mockPurchaseId);
    });
  });

  describe("receive", () => {
    const receiveDto = {
      locationId: mockLocationId,
      items: [
        {
          purchaseItemId: "item-1",
          batches: [
            {
              quantity: 10,
              batchNumber: "BAT-001",
            },
          ],
        },
      ],
    };

    it("should throw NotFoundException if purchase order does not exist or belongs to another org", async () => {
      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue({ id: mockLocationId, organizationId: mockOrgId });
      prismaMock.tx.purchase.findFirst.mockResolvedValue(null);

      await expect(
        useCase.receive(mockOrgId, mockMemberId, mockPurchaseId, receiveDto),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.tx.purchase.findFirst).toHaveBeenCalledWith({
        where: { id: mockPurchaseId, organizationId: mockOrgId },
        include: { items: { include: { variant: true } } },
      });
    });

    it("should throw NotFoundException if locationId does not belong to the organization", async () => {
      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(
        useCase.receive(mockOrgId, mockMemberId, mockPurchaseId, receiveDto),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: mockLocationId, organizationId: mockOrgId },
      });
      expect(prismaMock.tx.stockReceipt.create).not.toHaveBeenCalled();
    });

    it("should process receipt successfully when locationId belongs to the organization", async () => {
      const mockPurchase = {
        id: mockPurchaseId,
        purchaseNumber: "PO-1001",
        status: PurchaseStatus.ORDERED,
        supplierId: "sup-1",
        items: [
          {
            id: "item-1",
            variantId: "var-1",
            unitCost: 100,
            orderedQuantity: 10,
            receivedQuantity: 0,
            variant: { productId: "prod-1" },
          },
        ],
      };

      prismaMock.client.inventoryLocation.findFirst.mockResolvedValue({
        id: mockLocationId,
        organizationId: mockOrgId,
      });
      prismaMock.tx.purchase.findFirst.mockResolvedValue(mockPurchase);
      prismaMock.tx.inventoryLocation.findFirst.mockResolvedValue({
        id: mockLocationId,
        organizationId: mockOrgId,
      });
      prismaMock.tx.stockReceipt.create.mockResolvedValue({ id: "receipt-1" });
      prismaMock.tx.stockBatch.create.mockResolvedValue({ id: "batch-1" });
      prismaMock.tx.productVariantStock.upsert.mockResolvedValue({});
      prismaMock.tx.purchaseItem.update.mockResolvedValue({});
      prismaMock.tx.purchase.findUnique.mockResolvedValue({
        ...mockPurchase,
        items: [{ ...mockPurchase.items[0], receivedQuantity: 10 }],
      });
      prismaMock.tx.purchase.update.mockResolvedValue({});

      const result = await useCase.receive(
        mockOrgId,
        mockMemberId,
        mockPurchaseId,
        receiveDto,
      );

      expect(prismaMock.tx.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: mockLocationId, organizationId: mockOrgId },
      });
      expect(result).toEqual({ id: "receipt-1" });
    });
  });
});
