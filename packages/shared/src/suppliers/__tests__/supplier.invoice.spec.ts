import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createSupplierInvoice,
  updateSupplierInvoice,
  deleteSupplierInvoice,
  getSupplierInvoices,
} from "../actions/supplier.invoice";
import { db as prisma } from "@repo/db";

vi.mock("@repo/db", () => {
  return {
    db: {
      purchase: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      supplierInvoice: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    Prisma: {
      Decimal: class {
        val: any;
        constructor(val: any) {
          this.val = val;
        }
      },
    },
    PaymentStatus: {
      UNPAID: "UNPAID",
      PAID: "PAID",
      PARTIAL: "PARTIAL",
    },
  };
});

describe("Supplier Invoice Actions Security", () => {
  const orgId = "org_123";
  const otherOrgId = "org_456";
  const purchaseId = "cjl3u5p1k00003b573d8a7k01";
  const supplierId = "cjl3u5p1k00003b573d8a7k02";
  const invoiceId = "cjl3u5p1k00003b573d8a7k03";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSupplierInvoice", () => {
    it("should throw error if purchase does not belong to the organization (IDOR)", async () => {
      vi.mocked(prisma.purchase.findFirst).mockResolvedValue(null);

      const dto = {
        purchaseId,
        organizationId: orgId,
        invoiceNumber: "INV-001",
        supplierId,
        issueDate: new Date(),
        dueDate: new Date(),
        subTotal: 100,
        taxAmount: 10,
        totalAmount: 110,
      };

      await expect(createSupplierInvoice(dto)).rejects.toThrow("Purchase not found");
      expect(prisma.purchase.findFirst).toHaveBeenCalledWith({
        where: { id: purchaseId, organizationId: orgId },
      });
      expect(prisma.supplierInvoice.create).not.toHaveBeenCalled();
    });

    it("should successfully create invoice if purchase belongs to organization", async () => {
      vi.mocked(prisma.purchase.findFirst).mockResolvedValue({
        id: purchaseId,
        organizationId: orgId,
        supplierId,
      } as any);

      vi.mocked(prisma.supplierInvoice.create).mockResolvedValue({
        id: invoiceId,
        organizationId: orgId,
      } as any);

      const dto = {
        purchaseId,
        organizationId: orgId,
        invoiceNumber: "INV-001",
        supplierId,
        issueDate: new Date(),
        dueDate: new Date(),
        subTotal: 100,
        taxAmount: 10,
        totalAmount: 110,
      };

      const result = await createSupplierInvoice(dto);
      expect(result).toBeDefined();
      expect(prisma.supplierInvoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          purchaseId,
          organizationId: orgId,
          invoiceNumber: "INV-001",
        }),
      });
      expect(prisma.purchase.update).toHaveBeenCalledWith({
        where: { id: purchaseId },
        data: { status: "BILLED" },
      });
    });
  });

  describe("updateSupplierInvoice", () => {
    it("should throw error if invoice does not belong to the organization (IDOR)", async () => {
      vi.mocked(prisma.supplierInvoice.findFirst).mockResolvedValue(null);

      await expect(
        updateSupplierInvoice(otherOrgId, invoiceId, { amountPaid: 50 })
      ).rejects.toThrow("Invoice not found");

      expect(prisma.supplierInvoice.findFirst).toHaveBeenCalledWith({
        where: { id: invoiceId, organizationId: otherOrgId },
      });
      expect(prisma.supplierInvoice.update).not.toHaveBeenCalled();
    });

    it("should update invoice with whitelisted fields and ignore non-whitelisted input (Mass Assignment)", async () => {
      vi.mocked(prisma.supplierInvoice.findFirst).mockResolvedValue({
        id: invoiceId,
        organizationId: orgId,
      } as any);

      vi.mocked(prisma.supplierInvoice.update).mockResolvedValue({
        id: invoiceId,
        amountPaid: 50,
      } as any);

      const maliciousDto: any = {
        amountPaid: 50,
        notes: "Partial payment",
        organizationId: "org_hacked",
        totalAmount: 0,
        purchaseId: "other_purchase",
      };

      await updateSupplierInvoice(orgId, invoiceId, maliciousDto);

      expect(prisma.supplierInvoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          issueDate: undefined,
          dueDate: undefined,
          status: undefined,
          notes: "Partial payment",
          invoiceUrl: undefined,
          amountPaid: expect.anything(),
        },
      });

      const updateCallData = vi.mocked(prisma.supplierInvoice.update).mock.calls[0][0].data;
      expect(updateCallData).not.toHaveProperty("organizationId");
      expect(updateCallData).not.toHaveProperty("totalAmount");
      expect(updateCallData).not.toHaveProperty("purchaseId");
    });
  });

  describe("deleteSupplierInvoice", () => {
    it("should throw error if invoice does not belong to the organization (IDOR)", async () => {
      vi.mocked(prisma.supplierInvoice.findFirst).mockResolvedValue(null);

      await expect(deleteSupplierInvoice(otherOrgId, invoiceId)).rejects.toThrow(
        "Invoice not found"
      );

      expect(prisma.supplierInvoice.findFirst).toHaveBeenCalledWith({
        where: { id: invoiceId, organizationId: otherOrgId },
      });
      expect(prisma.supplierInvoice.delete).not.toHaveBeenCalled();
    });

    it("should delete invoice when organization matches", async () => {
      vi.mocked(prisma.supplierInvoice.findFirst).mockResolvedValue({
        id: invoiceId,
        organizationId: orgId,
      } as any);

      vi.mocked(prisma.supplierInvoice.delete).mockResolvedValue({
        id: invoiceId,
      } as any);

      await deleteSupplierInvoice(orgId, invoiceId);

      expect(prisma.supplierInvoice.delete).toHaveBeenCalledWith({
        where: { id: invoiceId },
      });
    });
  });

  describe("getSupplierInvoices", () => {
    it("should filter invoices by organizationId", async () => {
      vi.mocked(prisma.supplierInvoice.findMany).mockResolvedValue([]);

      await getSupplierInvoices(orgId);

      expect(prisma.supplierInvoice.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: {
          purchase: true,
          supplier: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
