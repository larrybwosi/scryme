import { describe, it, expect, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    $transaction: vi.fn(),
    productVariantStock: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    stockAdjustment: {
      create: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
      update: vi.fn(),
    },
    stockBatch: {
      create: vi.fn(),
    },
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { bulkUpdateLocationStock } from "../stock-management";

describe("bulkUpdateLocationStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if unauthenticated", async () => {
    (getServerAuth as any).mockResolvedValue(null);

    await expect(
      bulkUpdateLocationStock("loc-1", [{ variantId: "var-1", newTotalStock: 10 }])
    ).rejects.toThrow("Unauthorized");
  });

  it("should return early if updates list is empty", async () => {
    (getServerAuth as any).mockResolvedValue({
      organizationId: "org-1",
      memberId: "mem-1",
    });

    const result = await bulkUpdateLocationStock("loc-1", []);
    expect(result).toEqual({ success: true, message: "No updates provided." });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("should execute stock updates correctly inside transaction", async () => {
    (getServerAuth as any).mockResolvedValue({
      organizationId: "org-1",
      memberId: "mem-1",
    });

    const mockTx = {
      productVariantStock: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.variantId_locationId.variantId === "var-1") {
            return Promise.resolve({
              id: "pvs-1",
              variantId: "var-1",
              locationId: "loc-1",
              currentStock: new Decimal(5),
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "pvs-1",
            variantId: "var-1",
            locationId: "loc-1",
            currentStock: new Decimal(5),
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
      },
      productVariant: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === "var-1") {
            return Promise.resolve({
              productId: "prod-1",
              sku: "SKU-1",
              buyingPrice: new Decimal(10),
            });
          }
          if (where.id === "var-2") {
            return Promise.resolve({
              productId: "prod-2",
              sku: "SKU-2",
              buyingPrice: new Decimal(20),
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "var-1",
            productId: "prod-1",
            sku: "SKU-1",
            buyingPrice: new Decimal(10),
          },
          {
            id: "var-2",
            productId: "prod-2",
            sku: "SKU-2",
            buyingPrice: new Decimal(20),
          },
        ]),
      },
      stockBatch: {
        create: vi.fn().mockResolvedValue({ id: "batch-1" }),
      },
      stockAdjustment: {
        create: vi.fn().mockResolvedValue({ id: "adj-1" }),
        update: vi.fn().mockResolvedValue({}),
      },
      stockMovement: {
        create: vi.fn().mockResolvedValue({ id: "mov-1" }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    (db.$transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    const result = await bulkUpdateLocationStock("loc-1", [
      { variantId: "var-1", newTotalStock: 15 }, // positive diff of +10
      { variantId: "var-2", newTotalStock: 5 },  // brand new stock record (+5)
    ]);

    expect(result).toEqual({ success: true, message: "Stock updated successfully." });
    expect(mockTx.stockAdjustment.create).toHaveBeenCalled();
    expect(mockTx.stockMovement.create).toHaveBeenCalled();
  });
});
