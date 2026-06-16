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
      invoice: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
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
    it("should create a partially paid invoice from a transaction", async () => {
      const orgId = "org-1";
      const orderId = "order-1";
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
      mockPrisma.client.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: "PAID",
        amountPaid: 116,
      });

      const result = await useCase.getInvoiceById(orgId, invId);

      expect(mockPrisma.client.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invId },
          data: expect.objectContaining({
            status: "PAID",
            amountPaid: 116,
          }),
        }),
      );
    });
  });
});
