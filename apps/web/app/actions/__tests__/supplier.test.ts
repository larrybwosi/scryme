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
    db: {
      supplier: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: {
        findFirst: vi.fn(),
      },
      productSupplier: {
        create: vi.fn(),
        updateMany: vi.fn(),
        findFirstOrThrow: vi.fn(),
        deleteMany: vi.fn(),
        upsert: vi.fn(),
      },
      favoriteSupplier: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      supplierReview: {
        create: vi.fn(),
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

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  addProductToSupplier,
  addVariantsToSupplier,
} from "../supplier";

describe("Supplier Server Actions - Relational Validation & Concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addProductToSupplier", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        addProductToSupplier({
          supplierId: "sup-1",
          productId: "prod-1",
          variantId: "var-1",
          costPrice: 45.5,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject addition if supplier does not belong to authenticated organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.supplier.findFirst as any).mockResolvedValue(null);
      (db.product.findFirst as any).mockResolvedValue({ id: "prod-1" });

      await expect(
        addProductToSupplier({
          supplierId: "foreign-sup",
          productId: "prod-1",
          variantId: "var-1",
          costPrice: 45.5,
        })
      ).rejects.toThrow("Supplier not found or unauthorized");

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-sup", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.productSupplier.create).not.toHaveBeenCalled();
    });

    it("should reject addition if product does not belong to authenticated organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.supplier.findFirst as any).mockResolvedValue({ id: "sup-1" });
      (db.product.findFirst as any).mockResolvedValue(null);

      await expect(
        addProductToSupplier({
          supplierId: "sup-1",
          productId: "foreign-prod",
          variantId: "var-1",
          costPrice: 45.5,
        })
      ).rejects.toThrow("Product not found or unauthorized");

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "sup-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-prod", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.productSupplier.create).not.toHaveBeenCalled();
    });

    it("should parallelize supplier and product validation lookups concurrently and create link", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.supplier.findFirst as any).mockResolvedValue({ id: "sup-1" });
      (db.product.findFirst as any).mockResolvedValue({ id: "prod-1" });
      (db.productSupplier.create as any).mockResolvedValue({
        id: "ps-1",
        supplierId: "sup-1",
        productId: "prod-1",
        variantId: "var-1",
        costPrice: 45.5,
      });

      const result = await addProductToSupplier({
        supplierId: "sup-1",
        productId: "prod-1",
        variantId: "var-1",
        costPrice: 45.5,
        supplierSku: "SUP-SKU-1",
      });

      expect(result).toEqual({
        id: "ps-1",
        supplierId: "sup-1",
        productId: "prod-1",
        variantId: "var-1",
        costPrice: 45.5,
      });

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "sup-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.productSupplier.create).toHaveBeenCalledWith({
        data: {
          supplierId: "sup-1",
          productId: "prod-1",
          variantId: "var-1",
          costPrice: expect.any(Object),
          supplierSku: "SUP-SKU-1",
        },
      });
    });
  });

  describe("addVariantsToSupplier", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        addVariantsToSupplier({
          supplierId: "sup-1",
          productId: "prod-1",
          variants: [{ variantId: "var-1", costPrice: 30 }],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject variants addition if supplier does not belong to authenticated organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.supplier.findFirst as any).mockResolvedValue(null);
      (db.product.findFirst as any).mockResolvedValue({ id: "prod-1" });

      await expect(
        addVariantsToSupplier({
          supplierId: "foreign-sup",
          productId: "prod-1",
          variants: [{ variantId: "var-1", costPrice: 30 }],
        })
      ).rejects.toThrow("Supplier not found or unauthorized");

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-sup", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("should reject variants addition if product does not belong to authenticated organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.supplier.findFirst as any).mockResolvedValue({ id: "sup-1" });
      (db.product.findFirst as any).mockResolvedValue(null);

      await expect(
        addVariantsToSupplier({
          supplierId: "sup-1",
          productId: "foreign-prod",
          variants: [{ variantId: "var-1", costPrice: 30 }],
        })
      ).rejects.toThrow("Product not found or unauthorized");

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "sup-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-prod", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("should parallelize validation queries and batch upsert variants in transaction", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.supplier.findFirst as any).mockResolvedValue({ id: "sup-1" });
      (db.product.findFirst as any).mockResolvedValue({ id: "prod-1" });
      (db.productSupplier.upsert as any).mockImplementation((params: any) =>
        Promise.resolve({ id: "ps-upserted", ...params })
      );

      const result = await addVariantsToSupplier({
        supplierId: "sup-1",
        productId: "prod-1",
        variants: [
          { variantId: "var-1", costPrice: 30, supplierSku: "SKU-1" },
          { variantId: "var-2", costPrice: 35, supplierSku: "SKU-2" },
        ],
      });

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "sup-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });
});
