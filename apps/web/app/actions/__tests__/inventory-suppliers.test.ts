import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => {
  class MockDecimal {
    val: any;
    constructor(val: any) {
      this.val = val;
    }
  }
  return {
    Decimal: MockDecimal,
    AdjustmentStatus: { APPROVED: "APPROVED" },
    MovementType: { ADJUSTMENT_IN: "ADJUSTMENT_IN", ADJUSTMENT_OUT: "ADJUSTMENT_OUT" },
    StockAdjustmentReason: { INITIAL_STOCK: "INITIAL_STOCK" },
    db: {
      product: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      supplier: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      productSupplier: {
        findFirst: vi.fn(),
        findFirstOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      productVariant: {
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (arg: any) => {
        if (typeof arg === "function") {
          return arg(vi.mocked(db));
        }
        return Promise.all(arg);
      }),
    },
  };
});

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock @repo/shared/realtime
vi.mock("@repo/shared/realtime", () => ({
  realtimeService: {
    publish: vi.fn(),
  },
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  linkProductSupplier,
  updateProductSupplierLink,
  unlinkProductSupplier,
} from "../inventory";

describe("Inventory Product Supplier Actions - Tenant Isolation & BOLA Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("linkProductSupplier", () => {
    it("should throw error if caller is unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        linkProductSupplier({
          productId: "prod-1",
          variantId: "var-1",
          supplierId: "sup-1",
          costPrice: 50,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject linking if product does not belong to caller organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.product.findFirst as any).mockResolvedValue(null);
      (db.supplier.findFirst as any).mockResolvedValue({ id: "sup-1" });

      await expect(
        linkProductSupplier({
          productId: "foreign-prod",
          variantId: "var-1",
          supplierId: "sup-1",
          costPrice: 50,
        })
      ).rejects.toThrow("Product or supplier not found or unauthorized");

      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: "foreign-prod",
          organizationId: "org-1",
          variants: { some: { id: "var-1" } },
        },
        select: { id: true },
      });
      expect(db.productSupplier.create).not.toHaveBeenCalled();
    });

    it("should reject linking if supplier does not belong to caller organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.product.findFirst as any).mockResolvedValue({ id: "prod-1" });
      (db.supplier.findFirst as any).mockResolvedValue(null);

      await expect(
        linkProductSupplier({
          productId: "prod-1",
          variantId: "var-1",
          supplierId: "foreign-sup",
          costPrice: 50,
        })
      ).rejects.toThrow("Product or supplier not found or unauthorized");

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: {
          id: "foreign-sup",
          organizationId: "org-1",
        },
        select: { id: true },
      });
      expect(db.productSupplier.create).not.toHaveBeenCalled();
    });

    it("should successfully link product to supplier and scope preferred updates to tenant", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.product.findFirst as any).mockResolvedValue({ id: "prod-1" });
      (db.supplier.findFirst as any).mockResolvedValue({ id: "sup-1" });
      (db.productSupplier.create as any).mockResolvedValue({
        id: "ps-new",
        productId: "prod-1",
        variantId: "var-1",
        supplierId: "sup-1",
        costPrice: 50,
        isPreferred: true,
      });

      const result = await linkProductSupplier({
        productId: "prod-1",
        variantId: "var-1",
        supplierId: "sup-1",
        costPrice: 50,
        isPreferred: true,
        supplierSku: "SKU-SUP-1",
      });

      expect(result.id).toBe("ps-new");
      expect(db.productSupplier.updateMany).toHaveBeenCalledWith({
        where: {
          productId: "prod-1",
          product: { organizationId: "org-1" },
        },
        data: { isPreferred: false },
      });
      expect(db.productSupplier.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-1",
          variantId: "var-1",
          supplierId: "sup-1",
          supplierSku: "SKU-SUP-1",
          costPrice: expect.any(Object),
          leadTimeDays: null,
          minimumOrderQuantity: null,
          isPreferred: true,
        },
        include: { supplier: true },
      });
    });
  });

  describe("updateProductSupplierLink", () => {
    it("should reject updates if caller is unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        updateProductSupplierLink("ps-1", { costPrice: 40 })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject update if link does not belong to caller organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.productSupplier.findFirst as any).mockResolvedValue(null);

      await expect(
        updateProductSupplierLink("foreign-ps", { costPrice: 40 })
      ).rejects.toThrow("Product supplier link not found or unauthorized");

      expect(db.productSupplier.findFirst).toHaveBeenCalledWith({
        where: {
          id: "foreign-ps",
          product: { organizationId: "org-1" },
        },
        select: { id: true, productId: true },
      });
      expect(db.productSupplier.updateMany).not.toHaveBeenCalled();
    });

    it("should successfully update supplier link and enforce tenant scoping on preferred update", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.productSupplier.findFirst as any).mockResolvedValue({
        id: "ps-1",
        productId: "prod-1",
      });
      (db.productSupplier.findFirstOrThrow as any).mockResolvedValue({
        id: "ps-1",
        productId: "prod-1",
        costPrice: 42,
        isPreferred: true,
      });

      const result = await updateProductSupplierLink("ps-1", {
        costPrice: 42,
        isPreferred: true,
      });

      expect(result.id).toBe("ps-1");
      expect(db.productSupplier.updateMany).toHaveBeenCalledWith({
        where: {
          productId: "prod-1",
          product: { organizationId: "org-1" },
        },
        data: { isPreferred: false },
      });
      expect(db.productSupplier.updateMany).toHaveBeenCalledWith({
        where: {
          id: "ps-1",
          product: { organizationId: "org-1" },
        },
        data: {
          costPrice: expect.any(Object),
          isPreferred: true,
          leadTimeDays: undefined,
          minimumOrderQuantity: undefined,
          supplierSku: undefined,
        },
      });
      expect(db.productSupplier.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          id: "ps-1",
          product: { organizationId: "org-1" },
        },
        include: { supplier: true },
      });
    });
  });

  describe("unlinkProductSupplier", () => {
    it("should reject unlinking if caller is unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(unlinkProductSupplier("ps-1")).rejects.toThrow("Unauthorized");
    });

    it("should reject unlinking if link belongs to a foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.productSupplier.findFirst as any).mockResolvedValue(null);

      await expect(unlinkProductSupplier("foreign-ps")).rejects.toThrow(
        "Product supplier link not found or unauthorized"
      );

      expect(db.productSupplier.findFirst).toHaveBeenCalledWith({
        where: {
          id: "foreign-ps",
          product: { organizationId: "org-1" },
        },
        select: { id: true, productId: true },
      });
      expect(db.productSupplier.deleteMany).not.toHaveBeenCalled();
    });

    it("should delete supplier link scoped strictly to organization via product relation", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.productSupplier.findFirst as any).mockResolvedValue({
        id: "ps-1",
        productId: "prod-1",
      });

      const result = await unlinkProductSupplier("ps-1");

      expect(result).toEqual({ success: true });
      expect(db.productSupplier.deleteMany).toHaveBeenCalledWith({
        where: {
          id: "ps-1",
          product: { organizationId: "org-1" },
        },
      });
    });
  });
});
