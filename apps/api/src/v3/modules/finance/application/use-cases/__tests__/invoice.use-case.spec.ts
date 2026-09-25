import { Test, TestingModule } from "@nestjs/testing";
import { InvoiceUseCase } from "../invoice.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { DocumentService } from "@/common/documents/document.service";
import { NotFoundException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("InvoiceUseCase", () => {
  let useCase: InvoiceUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
      invoice: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findFirstOrThrow: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      invoiceItem: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      invoiceConfig: { findUnique: vi.fn() },
      invoiceTemplate: { findMany: vi.fn(), create: vi.fn() },
      organization: { findUnique: vi.fn() },
      transaction: { findFirst: vi.fn() },
    },
  };

  const mockDocumentService = { generateInvoicePDF: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceUseCase,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DocumentService, useValue: mockDocumentService },
      ],
    }).compile();
    useCase = module.get<InvoiceUseCase>(InvoiceUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("Core Functionality", () => {
    it("should be defined", () => {
      expect(useCase).toBeDefined();
    });

    it("should return all invoices for an organization", async () => {
      const orgId = "org-1";
      const mockInvoices = [{ id: "inv-1", organizationId: orgId }];
      mockPrisma.client.invoice.findMany.mockResolvedValue(mockInvoices);
      const result = await useCase.getInvoices(orgId);
      expect(result).toEqual(mockInvoices);
    });

    it("should return an invoice if found", async () => {
      const orgId = "org-1";
      const invId = "inv-1";
      const mockInvoice = { id: invId, organizationId: orgId };
      mockPrisma.client.invoice.findFirst.mockResolvedValue(mockInvoice);
      const result = await useCase.getInvoiceById(orgId, invId);
      expect(result).toEqual(mockInvoice);
    });

    it("should throw NotFoundException if invoice not found", async () => {
      mockPrisma.client.invoice.findFirst.mockResolvedValue(null);
      await expect(useCase.getInvoiceById("org-1", "inv-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Partially Paid Invoices", () => {
    it("should return null if autoGenerateInvoice is false when creating invoice from order", async () => {
      const orgId = "org-1";
      const orderId = "order-1";
      mockPrisma.client.invoiceConfig.findUnique.mockResolvedValue({
        autoGenerateInvoice: false,
      });

      const result = await useCase.createInvoiceFromOrder(orgId, orderId);

      expect(result).toBeNull();
      expect(mockPrisma.client.transaction.findFirst).not.toHaveBeenCalled();
    });

    it("should create a partially paid invoice from a transaction", async () => {
      const orgId = "org-1";
      const orderId = "order-1";
      mockPrisma.client.invoiceConfig.findUnique.mockResolvedValue({
        autoGenerateInvoice: true,
      });
      const mockOrder = {
        id: orderId,
        organizationId: orgId,
        subtotal: 100,
        finalTotal: 116,
        totalPaid: 50,
        items: [
          {
            sku: "SKU1",
            productName: "P1",
            variantName: "V1",
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
          },
        ],
        businessAccount: { name: "Customer 1" },
      };
      mockPrisma.client.transaction.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.client.invoice.create.mockResolvedValue({
        id: "inv-1",
        status: "PARTIALLY_PAID",
        amountPaid: 50,
      });

      const result = await useCase.createInvoiceFromOrder(orgId, orderId);

      expect(result).toBeDefined();
      expect(mockPrisma.client.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionId: orderId,
            amountPaid: 50,
            balanceDue: 66,
            status: "PARTIALLY_PAID",
          }),
        }),
      );
    });

    it("should sync invoice status when fetched", async () => {
      const orgId = "org-1";
      const invId = "inv-1";
      const mockInvoice = {
        id: invId,
        organizationId: orgId,
        status: "UNPAID",
        amountPaid: 0,
        transaction: { id: "order-1", finalTotal: 116, totalPaid: 116 },
      };
      mockPrisma.client.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.client.invoice.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.invoice.findFirstOrThrow.mockResolvedValue({
        ...mockInvoice,
        status: "PAID",
        amountPaid: 116,
      });

      const result = await useCase.getInvoiceById(orgId, invId);

      expect(mockPrisma.client.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invId, organizationId: orgId },
          data: expect.objectContaining({
            status: "PAID",
            amountPaid: 116,
          }),
        }),
      );
    });
  });

  describe("Tenant Isolation / BOLA Protection", () => {
    it("should use updateMany with organizationId when updating an invoice", async () => {
      const orgId = "org-1";
      const invId = "inv-1";
      const mockInvoice = {
        id: invId,
        organizationId: orgId,
        status: "DRAFT",
        items: [],
      };
      mockPrisma.client.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.client.invoice.updateMany.mockResolvedValue({ count: 1 });

      const dto = {
        customer: "Acme Corp",
        postingDate: new Date(),
        items: [
          {
            itemCode: "ITEM-1",
            itemName: "Widget",
            quantity: 2,
            rate: 50,
            amount: 100,
          },
        ],
      };

      await useCase.updateInvoice(orgId, invId, dto as any);

      expect(mockPrisma.client.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invId, organizationId: orgId },
        }),
      );
    });

    it("should throw NotFoundException if updateMany returns 0 count during updateInvoice", async () => {
      const orgId = "org-1";
      const invId = "inv-1";
      const mockInvoice = { id: invId, organizationId: orgId, status: "DRAFT" };
      mockPrisma.client.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.client.invoice.updateMany.mockResolvedValue({ count: 0 });

      const dto = {
        customer: "Acme Corp",
        postingDate: new Date(),
        items: [],
      };

      await expect(useCase.updateInvoice(orgId, invId, dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should use deleteMany with organizationId when deleting an invoice", async () => {
      const orgId = "org-1";
      const invId = "inv-1";
      const mockInvoice = { id: invId, organizationId: orgId, status: "DRAFT" };
      mockPrisma.client.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.client.invoice.deleteMany.mockResolvedValue({ count: 1 });

      const result = await useCase.deleteInvoice(orgId, invId);

      expect(mockPrisma.client.invoice.deleteMany).toHaveBeenCalledWith({
        where: { id: invId, organizationId: orgId },
      });
      expect(result).toEqual(mockInvoice);
    });

    it("should use updateMany with organizationId when finalizing an invoice", async () => {
      const orgId = "org-1";
      const invId = "inv-1";
      const mockInvoice = { id: invId, organizationId: orgId, status: "DRAFT" };
      mockPrisma.client.organization.findUnique.mockResolvedValue({ settings: {} });
      mockPrisma.client.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrisma.client.invoice.updateMany.mockResolvedValue({ count: 1 });

      await useCase.finalizeInvoice(orgId, invId);

      expect(mockPrisma.client.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invId, organizationId: orgId },
          data: { status: "UNPAID" },
        }),
      );
    });
  });

  describe("Template Creation (Mass Assignment Protection)", () => {
    it("should create a template with only the whitelisted DTO fields", async () => {
      const orgId = "org-1";
      const dto = {
        name: "My Custom Template",
        description: "A secure invoice template",
        type: "SALES_INVOICE",
        templateData: { customFont: "Inter" },
        logoUrl: "https://example.com/logo.png",
        showLineNumbers: true,
        showTaxBreakdown: false,
        showTerms: true,
        showNotes: true,
        defaultNotes: "Thank you for your business!",
        defaultTerms: "Net 30",
        paymentTermsDay: 30,
        isActive: true,
        isDefault: false,
        // The following is malicious input attempting mass assignment / IDOR
        id: "malicious-template-id",
        organizationId: "malicious-org-id",
        extraField: "should-be-ignored",
      } as any;

      mockPrisma.client.invoiceTemplate.create.mockResolvedValue({
        id: "generated-cuid",
        name: "My Custom Template",
        organizationId: orgId,
      });

      const result = await useCase.createTemplate(orgId, dto);

      expect(result).toBeDefined();
      expect(mockPrisma.client.invoiceTemplate.create).toHaveBeenCalledWith({
        data: {
          name: "My Custom Template",
          description: "A secure invoice template",
          type: "SALES_INVOICE",
          templateData: { customFont: "Inter" },
          logoUrl: "https://example.com/logo.png",
          showLineNumbers: true,
          showTaxBreakdown: false,
          showTerms: true,
          showNotes: true,
          defaultNotes: "Thank you for your business!",
          defaultTerms: "Net 30",
          paymentTermsDay: 30,
          isActive: true,
          isDefault: false,
          organizationId: orgId,
        },
      });
    });
  });
});
