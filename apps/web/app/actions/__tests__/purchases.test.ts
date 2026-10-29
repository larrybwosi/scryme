import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    member: {
      findUnique: vi.fn(),
    },
    supplier: {
      findFirst: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    purchase: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
    },
    supplierInvoice: {
      create: vi.fn(),
    },
    purchasePayment: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) =>
      cb({
        purchase: {
          create: vi.fn().mockResolvedValue({
            id: "po-1",
            purchaseNumber: "PO-2026-0001",
            organizationId: "org-1",
          }),
          update: vi.fn(),
        },
      })
    ),
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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock submitForApproval
vi.mock("../approvals", () => ({
  submitForApproval: vi.fn(),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  createPurchase,
  receivePurchaseStockWithBatches,
  recordSupplierInvoice,
  updatePurchaseStatus,
  createPurchasePayment,
} from "../purchases";

describe("Purchase Server Actions - Security Hardening & BOLA Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPurchase", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        createPurchase({
          supplierId: "sup-1",
          items: [{ variantId: "var-1", quantity: 10, unitCost: 100 }],
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject purchase creation if supplierId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.count as any).mockResolvedValue(0);
      (db.supplier.findFirst as any).mockResolvedValue(null); // Supplier not found in org-1
      (db.organization.findUnique as any).mockResolvedValue({
        expenseApprovalThreshold: 0,
      });

      await expect(
        createPurchase({
          supplierId: "foreign-supplier-id",
          items: [{ variantId: "var-1", quantity: 5, unitCost: 50 }],
        })
      ).rejects.toThrow("Supplier not found or access denied");

      expect(db.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-supplier-id", organizationId: "org-1" },
        select: { name: true },
      });
    });

    it("should reject purchase creation if item variantId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.count as any).mockResolvedValue(0);
      (db.supplier.findFirst as any).mockResolvedValue({ name: "Acme Supplies" });
      (db.organization.findUnique as any).mockResolvedValue({
        expenseApprovalThreshold: 0,
      });
      (db.productVariant.findMany as any).mockResolvedValue([]); // Foreign variant not found in org-1

      await expect(
        createPurchase({
          supplierId: "sup-1",
          items: [{ variantId: "foreign-variant-id", quantity: 5, unitCost: 50 }],
        })
      ).rejects.toThrow("One or more product variants not found or access denied");

      expect(db.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["foreign-variant-id"] },
          product: { organizationId: "org-1" },
        },
        select: { id: true },
      });
    });

    it("should create purchase order when supplier and variants belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.count as any).mockResolvedValue(2);
      (db.supplier.findFirst as any).mockResolvedValue({ name: "Acme Supplies" });
      (db.organization.findUnique as any).mockResolvedValue({
        expenseApprovalThreshold: 0,
      });
      (db.productVariant.findMany as any).mockResolvedValue([{ id: "var-1" }]);

      const result = await createPurchase({
        supplierId: "sup-1",
        items: [{ variantId: "var-1", quantity: 5, unitCost: 50 }],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("po-1");
    });
  });

  describe("receivePurchaseStockWithBatches", () => {
    it("should reject stock receipt if locationId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.findUnique as any).mockResolvedValue({
        id: "po-1",
        organizationId: "org-1",
        items: [],
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null); // Foreign location

      await expect(
        receivePurchaseStockWithBatches({
          purchaseId: "po-1",
          locationId: "foreign-location-id",
          items: [],
        })
      ).rejects.toThrow("Location not found or access denied");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-location-id", organizationId: "org-1" },
        select: { id: true },
      });
    });
  });

  describe("recordSupplierInvoice", () => {
    it("should reject invoice recording if purchase order belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.findFirst as any).mockResolvedValue(null);

      await expect(
        recordSupplierInvoice({
          purchaseId: "foreign-po-id",
          invoiceNumber: "INV-100",
          amount: 500,
          issueDate: new Date(),
          dueDate: new Date(),
        })
      ).rejects.toThrow("Purchase order not found or access denied");

      expect(db.purchase.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-po-id", organizationId: "org-1" },
      });
      expect(db.supplierInvoice.create).not.toHaveBeenCalled();
    });

    it("should record supplier invoice and update purchase status when purchase order belongs to organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.findFirst as any).mockResolvedValue({
        id: "po-1",
        supplierId: "sup-1",
        organizationId: "org-1",
      });
      (db.supplierInvoice.create as any).mockResolvedValue({
        id: "inv-1",
        invoiceNumber: "INV-100",
      });
      (db.purchase.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await recordSupplierInvoice({
        purchaseId: "po-1",
        invoiceNumber: "INV-100",
        amount: 500,
        issueDate: new Date("2026-01-01"),
        dueDate: new Date("2026-01-31"),
      });

      expect(result).toEqual({ id: "inv-1", invoiceNumber: "INV-100" });
      expect(db.purchase.updateMany).toHaveBeenCalledWith({
        where: { id: "po-1", organizationId: "org-1" },
        data: { status: "BILLED" },
      });
    });
  });

  describe("updatePurchaseStatus", () => {
    it("should throw error if purchase order does not belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(
        updatePurchaseStatus("foreign-po-id", "CANCELLED")
      ).rejects.toThrow("Purchase order not found or access denied");

      expect(db.purchase.updateMany).toHaveBeenCalledWith({
        where: { id: "foreign-po-id", organizationId: "org-1" },
        data: { status: "CANCELLED" },
      });
    });

    it("should update purchase status using updateMany scoped strictly by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.updateMany as any).mockResolvedValue({ count: 1 });
      (db.purchase.findFirstOrThrow as any).mockResolvedValue({
        id: "po-1",
        organizationId: "org-1",
        status: "CANCELLED",
      });

      const result = await updatePurchaseStatus("po-1", "CANCELLED");

      expect(result).toEqual({
        id: "po-1",
        organizationId: "org-1",
        status: "CANCELLED",
      });
    });
  });

  describe("createPurchasePayment", () => {
    it("should reject payment creation if purchase order belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.findFirst as any).mockResolvedValue(null);

      await expect(
        createPurchasePayment({
          purchaseId: "foreign-po-id",
          amount: 200,
          paymentMethod: "CASH",
        })
      ).rejects.toThrow("Purchase order not found or access denied");

      expect(db.purchasePayment.create).not.toHaveBeenCalled();
    });

    it("should record payment and update purchase payment status when purchase order belongs to organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
      });
      (db.purchase.findFirst as any).mockResolvedValue({
        id: "po-1",
        organizationId: "org-1",
        totalAmount: 500,
        payments: [{ amount: 300 }],
      });
      (db.purchasePayment.create as any).mockResolvedValue({
        id: "pay-1",
        amount: 200,
      });
      (db.purchase.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await createPurchasePayment({
        purchaseId: "po-1",
        amount: 200,
        paymentMethod: "CASH",
      });

      expect(result).toEqual({ id: "pay-1", amount: 200 });
      expect(db.purchase.updateMany).toHaveBeenCalledWith({
        where: { id: "po-1", organizationId: "org-1" },
        data: {
          paidAmount: 500,
          paymentStatus: "PAID",
        },
      });
    });
  });
});
