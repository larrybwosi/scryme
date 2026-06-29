import { describe, it, expect, beforeEach, vi } from "vitest";
import { InventoryIntegrityService } from "./inventory-integrity.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Decimal } from "decimal.js";

describe("InventoryIntegrityService", () => {
  let service: InventoryIntegrityService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        productVariant: {
          findMany: vi.fn(),
        },
        productVariantStock: {
          findMany: vi.fn(),
          update: vi.fn(),
        },
        stockBatch: {
          findMany: vi.fn(),
        },
      },
    };
    service = new InventoryIntegrityService(prisma as any);
  });

  describe("verifyVariantIntegrity", () => {
    it("should return issues when stock summary does not match batch totals", async () => {
      const variantId = "var-1";
      const locationId = "loc-1";

      prisma.client.productVariantStock.findMany.mockResolvedValue([
        {
          variantId,
          locationId,
          currentStock: 10,
        },
      ]);

      prisma.client.stockBatch.findMany.mockResolvedValue([
        {
          variantId,
          locationId,
          currentQuantity: 4,
        },
        {
          variantId,
          locationId,
          currentQuantity: 5,
        },
      ]);

      const issues = await service.verifyVariantIntegrity("org-1", variantId);

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        type: "STOCK_BATCH_MISMATCH",
        variantId,
        locationId,
        stockQty: 10,
        batchTotalQty: 9,
        diff: -1,
      });
    });

    it("should return no issues when stock summary matches batch totals", async () => {
      const variantId = "var-1";
      const locationId = "loc-1";

      prisma.client.productVariantStock.findMany.mockResolvedValue([
        {
          variantId,
          locationId,
          currentStock: 10,
        },
      ]);

      prisma.client.stockBatch.findMany.mockResolvedValue([
        {
          variantId,
          locationId,
          currentQuantity: 10,
        },
      ]);

      const issues = await service.verifyVariantIntegrity("org-1", variantId);

      expect(issues).toHaveLength(0);
    });
  });

  describe("verifyOrganizationIntegrity", () => {
    it("should process all variants in batches and return overall status", async () => {
      const organizationId = "org-1";

      // First call returns 1 variant, second call returns empty
      prisma.client.productVariant.findMany
        .mockResolvedValueOnce([{ id: "var-1" }])
        .mockResolvedValueOnce([]);

      // Mock verifyVariantIntegrity results indirectly by mocking prisma calls inside it
      prisma.client.productVariantStock.findMany.mockResolvedValue([
        {
          variantId: "var-1",
          locationId: "loc-1",
          currentStock: 10,
        },
      ]);
      prisma.client.stockBatch.findMany.mockResolvedValue([
        {
          variantId: "var-1",
          locationId: "loc-1",
          currentQuantity: 10,
        },
      ]);

      const result = await service.verifyOrganizationIntegrity(organizationId);

      expect(result.status).toBe("HEALTHY");
      expect(prisma.client.productVariant.findMany).toHaveBeenCalled();
    });
  });
});
