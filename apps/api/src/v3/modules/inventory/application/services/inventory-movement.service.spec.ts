import { describe, it, expect, beforeEach, vi } from "vitest";
import { InventoryMovementService } from "./inventory-movement.service";
import { MovementType } from "@repo/db";
import { Decimal } from "decimal.js";

describe("InventoryMovementService", () => {
  let service: InventoryMovementService;
  let prisma: any;
  let tx: any;

  beforeEach(() => {
    prisma = {
      client: {},
    };
    tx = {
      stockMovement: {
        create: vi.fn().mockResolvedValue({ id: "move-1" }),
      },
      serialNumber: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      productVariantStock: {
        findMany: vi.fn(),
      },
      stockBatch: {
        groupBy: vi.fn(),
      },
    };
    service = new InventoryMovementService(prisma as any);
    // @ts-expect-error - access private logger to spy on it
    vi.spyOn(service.logger, "error").mockImplementation(() => {});
    // @ts-expect-error - access private logger to spy on it
    vi.spyOn(service.logger, "log").mockImplementation(() => {});
  });

  describe("recordMovement and verifyIntegrity", () => {
    it("should log an error when stock summary does not match batch totals", async () => {
      const organizationId = "org-1";
      const variantId = "var-1";
      const locationId = "loc-1";

      tx.productVariantStock.findMany.mockResolvedValue([
        {
          locationId,
          currentStock: new Decimal(10),
        },
      ]);

      tx.stockBatch.groupBy.mockResolvedValue([
        {
          locationId,
          _sum: {
            currentQuantity: new Decimal(9),
          },
        },
      ]);

      await service.recordMovement(tx, {
        organizationId,
        memberId: "mem-1",
        variantId,
        quantity: 1,
        toLocationId: locationId,
        movementType: MovementType.ADJUSTMENT_IN,
      });

      // @ts-expect-error - accessing private logger
      expect(service.logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`[Integrity Alert] Stock mismatch for variant ${variantId} at location ${locationId}`),
      );
    });

    it("should NOT log an error when stock summary matches batch totals", async () => {
      const organizationId = "org-1";
      const variantId = "var-1";
      const locationId = "loc-1";

      tx.productVariantStock.findMany.mockResolvedValue([
        {
          locationId,
          currentStock: new Decimal(10),
        },
      ]);

      tx.stockBatch.groupBy.mockResolvedValue([
        {
          locationId,
          _sum: {
            currentQuantity: new Decimal(10),
          },
        },
      ]);

      await service.recordMovement(tx, {
        organizationId,
        memberId: "mem-1",
        variantId,
        quantity: 1,
        toLocationId: locationId,
        movementType: MovementType.ADJUSTMENT_IN,
      });

      // @ts-expect-error - accessing private logger
      expect(service.logger.error).not.toHaveBeenCalled();
    });

    it("should handle movements with both from and to locations", async () => {
      const organizationId = "org-1";
      const variantId = "var-1";
      const fromLoc = "loc-1";
      const toLoc = "loc-2";

      tx.productVariantStock.findMany.mockResolvedValue([
        { locationId: fromLoc, currentStock: new Decimal(5) },
        { locationId: toLoc, currentStock: new Decimal(15) },
      ]);

      tx.stockBatch.groupBy.mockResolvedValue([
        { locationId: fromLoc, _sum: { currentQuantity: new Decimal(5) } },
        { locationId: toLoc, _sum: { currentQuantity: new Decimal(15) } },
      ]);

      await service.recordMovement(tx, {
        organizationId,
        memberId: "mem-1",
        variantId,
        quantity: 5,
        fromLocationId: fromLoc,
        toLocationId: toLoc,
        movementType: MovementType.TRANSFER,
      });

      expect(tx.productVariantStock.findMany).toHaveBeenCalledWith({
        where: { variantId, locationId: { in: [fromLoc, toLoc] } },
        select: { locationId: true, currentStock: true },
      });
      // @ts-expect-error - accessing private logger
      expect(service.logger.error).not.toHaveBeenCalled();
    });
  });
});
