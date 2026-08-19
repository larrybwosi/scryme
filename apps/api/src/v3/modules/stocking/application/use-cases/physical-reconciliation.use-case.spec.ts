import { vi, describe, it, expect, beforeEach } from "vitest";
import { PhysicalReconciliationUseCase } from "./physical-reconciliation.use-case";
import { ReconciliationStatus } from "@repo/db";

describe("PhysicalReconciliationUseCase", () => {
  let physicalReconciliationUseCase: PhysicalReconciliationUseCase;
  let prisma: any;
  let inventoryMovementService: any;
  let mockTx: any;

  const mockOrgId = "org-1";
  const mockLocationId = "loc-1";
  const mockMemberId = "member-1";

  beforeEach(() => {
    mockTx = {
      productVariantStock: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      stockReconciliation: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      stockAdjustment: {
        create: vi.fn(),
      },
      stockBatch: {
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      reconciliationItem: {
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async (callback) => await callback(mockTx)),
        productVariantStock: mockTx.productVariantStock,
        stockReconciliation: mockTx.stockReconciliation,
      },
    };

    inventoryMovementService = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };

    physicalReconciliationUseCase = new PhysicalReconciliationUseCase(
      prisma,
      inventoryMovementService,
    );
  });

  describe("generateCountSheet", () => {
    it("should fetch stock with targeted select block and map correctly", async () => {
      const mockStocks = [
        {
          variantId: "var-1",
          currentStock: 10,
          variant: {
            sku: "SKU-01",
            name: "Vanilla Donut",
            product: {
              name: "Donut",
            },
          },
        },
      ];

      mockTx.productVariantStock.findMany.mockResolvedValue(mockStocks);

      const countSheet = await physicalReconciliationUseCase.generateCountSheet(
        mockOrgId,
        mockLocationId,
      );

      // Verify targeted select database call
      expect(mockTx.productVariantStock.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId, locationId: mockLocationId, currentStock: { gt: 0 } },
        select: {
          variantId: true,
          currentStock: true,
          variant: {
            select: {
              sku: true,
              name: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Verify mapped fields
      expect(countSheet).toEqual([
        {
          variantId: "var-1",
          sku: "SKU-01",
          name: "Vanilla Donut",
          productName: "Donut",
          expectedQuantity: 10,
        },
      ]);
    });
  });

  describe("submit", () => {
    it("should submit reconciliation sheet and create record in a transaction", async () => {
      mockTx.productVariantStock.findMany.mockResolvedValue([
        {
          variantId: "var-1",
          currentStock: 10,
          variant: { buyingPrice: 50 },
        },
      ]);

      mockTx.stockReconciliation.create.mockResolvedValue({ id: "rec-123" });

      const dto = {
        locationId: mockLocationId,
        description: "Year-end audit",
        items: [
          {
            variantId: "var-1",
            actualQuantity: 12,
            notes: "Found 2 extra",
          },
        ],
      };

      const result = await physicalReconciliationUseCase.submit(
        mockOrgId,
        mockMemberId,
        dto,
      );

      expect(mockTx.productVariantStock.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          variantId: { in: ["var-1"] },
          locationId: mockLocationId,
        },
        select: {
          variantId: true,
          currentStock: true,
          variant: {
            select: { buyingPrice: true },
          },
        },
      });

      expect(mockTx.stockReconciliation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          locationId: mockLocationId,
          status: ReconciliationStatus.PENDING_REVIEW,
          expectedValue: 500, // 10 * 50
          actualValue: 600, // 12 * 50
          varianceValue: 100,
          items: {
            create: [
              {
                productVariantId: "var-1",
                expectedQuantity: 10,
                actualQuantity: 12,
                varianceQuantity: 2,
                expectedValue: 500,
                actualValue: 600,
                varianceValue: 100,
                unitPrice: 50,
                resolutionNotes: "Found 2 extra",
              },
            ],
          },
        }),
      });

      expect(result).toEqual({ id: "rec-123" });
    });
  });

  describe("approve", () => {
    it("should approve pending reconciliation using findFirst with organizationId scoping", async () => {
      const mockReconciliation = {
        id: "rec-123",
        status: ReconciliationStatus.PENDING_REVIEW,
        locationId: mockLocationId,
        items: [
          {
            id: "item-1",
            productVariantId: "var-1",
            varianceQuantity: 2,
            unitPrice: 50,
          },
        ],
      };

      mockTx.stockReconciliation.findFirst.mockResolvedValue(mockReconciliation);
      mockTx.stockAdjustment.create.mockResolvedValue({ id: "adj-1" });
      mockTx.productVariantStock.update.mockResolvedValue({});
      mockTx.stockBatch.create.mockResolvedValue({});
      mockTx.reconciliationItem.updateMany.mockResolvedValue({ count: 1 });
      mockTx.stockReconciliation.update.mockResolvedValue({
        id: "rec-123",
        status: ReconciliationStatus.COMPLETED,
      });

      const result = await physicalReconciliationUseCase.approve(
        mockOrgId,
        mockMemberId,
        "rec-123",
      );

      expect(mockTx.stockReconciliation.findFirst).toHaveBeenCalledWith({
        where: { id: "rec-123", organizationId: mockOrgId },
        include: { items: true },
      });

      expect(mockTx.stockAdjustment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          variantId: "var-1",
          quantity: 2,
        }),
      });

      expect(result).toEqual({
        id: "rec-123",
        status: ReconciliationStatus.COMPLETED,
      });
    });

    it("should throw NotFoundException if reconciliation is not found for the organization", async () => {
      mockTx.stockReconciliation.findFirst.mockResolvedValue(null);

      await expect(
        physicalReconciliationUseCase.approve(
          mockOrgId,
          mockMemberId,
          "other-org-rec-123",
        ),
      ).rejects.toThrow("Reconciliation not found");

      expect(mockTx.stockReconciliation.findFirst).toHaveBeenCalledWith({
        where: { id: "other-org-rec-123", organizationId: mockOrgId },
        include: { items: true },
      });
    });
  });
});
