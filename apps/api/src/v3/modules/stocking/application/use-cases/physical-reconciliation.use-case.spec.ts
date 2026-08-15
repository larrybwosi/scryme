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
        findFirst: vi.fn(),
        findUnique: vi.fn(),
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
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async (callback) => await callback(mockTx)),
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        productVariant: {
          count: vi.fn(),
        },
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
    it("should throw BadRequestException if location does not belong to organization", async () => {
      prisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      const dto = {
        locationId: mockLocationId,
        description: "Year-end audit",
        items: [{ variantId: "var-1", actualQuantity: 12 }],
      };

      await expect(
        physicalReconciliationUseCase.submit(mockOrgId, mockMemberId, dto),
      ).rejects.toThrow("Invalid location");
    });

    it("should throw BadRequestException if any variant does not belong to organization", async () => {
      prisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: mockLocationId });
      prisma.client.productVariant.count.mockResolvedValue(0);

      const dto = {
        locationId: mockLocationId,
        description: "Year-end audit",
        items: [{ variantId: "var-1", actualQuantity: 12 }],
      };

      await expect(
        physicalReconciliationUseCase.submit(mockOrgId, mockMemberId, dto),
      ).rejects.toThrow("One or more invalid variants requested");
    });

    it("should submit reconciliation sheet and create record in a transaction", async () => {
      prisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: mockLocationId });
      prisma.client.productVariant.count.mockResolvedValue(1);

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
    it("should fetch reconciliation using findFirst with organizationId scoping", async () => {
      mockTx.stockReconciliation.findFirst.mockResolvedValue({
        id: "rec-1",
        organizationId: mockOrgId,
        locationId: mockLocationId,
        status: ReconciliationStatus.PENDING_REVIEW,
        items: [],
      });
      mockTx.stockReconciliation.update.mockResolvedValue({
        id: "rec-1",
        status: ReconciliationStatus.COMPLETED,
      });

      const result = await physicalReconciliationUseCase.approve(
        mockOrgId,
        mockMemberId,
        "rec-1",
      );

      expect(mockTx.stockReconciliation.findFirst).toHaveBeenCalledWith({
        where: { id: "rec-1", organizationId: mockOrgId },
        include: { items: true },
      });
      expect(result.status).toEqual(ReconciliationStatus.COMPLETED);
    });
  });
});
