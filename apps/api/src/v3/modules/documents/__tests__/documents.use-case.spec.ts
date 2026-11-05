import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentsUseCase } from "../application/documents.use-case";
import { DocumentService } from "@/common/documents/document.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Readable } from "stream";

describe("DocumentsUseCase", () => {
  let useCase: DocumentsUseCase;
  let mockPrisma: any;
  let mockDocService: any;

  beforeEach(() => {
    mockDocService = {
      generateStockRequestPDF: vi.fn(),
      generateStockTransferPDF: vi.fn(),
      generateInvoicePDF: vi.fn(),
      generateReceiptPDF: vi.fn(),
      generateV3DocumentPDF: vi.fn().mockResolvedValue(new Readable()),
    };

    mockPrisma = {
      client: {
        transaction: {
          findFirst: vi.fn(),
        },
        stockTransfer: {
          findFirst: vi.fn(),
        },
        invoiceConfig: {
          findUnique: vi.fn(),
          create: vi.fn(),
          upsert: vi.fn(),
        },
        receiptConfig: {
          findUnique: vi.fn(),
          create: vi.fn(),
          upsert: vi.fn(),
        },
        waybillConfig: {
          findUnique: vi.fn(),
          create: vi.fn(),
          upsert: vi.fn(),
        },
        deliveryNoteConfig: {
          findUnique: vi.fn(),
          create: vi.fn(),
          upsert: vi.fn(),
        },
      },
    };

    useCase = new DocumentsUseCase(
      mockPrisma as unknown as PrismaService,
      mockDocService as unknown as DocumentService,
    );
  });

  it("should retrieve organization invoiceConfig", async () => {
    const fakeConfig = { organizationId: "org-1", companyName: "Test Org" };
    mockPrisma.client.invoiceConfig.findUnique.mockResolvedValue(fakeConfig);

    const result = await useCase.getDocumentConfig("invoice", "org-1");
    expect(result).toEqual(fakeConfig);
    expect(mockPrisma.client.invoiceConfig.findUnique).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
    });
  });

  it("should update organization deliveryNoteConfig", async () => {
    const updated = {
      organizationId: "org-1",
      companyName: "Acme",
      primaryColor: "#ff0000",
    };
    mockPrisma.client.deliveryNoteConfig.upsert.mockResolvedValue(updated);

    const result = await useCase.updateDocumentConfig(
      "delivery-note",
      "org-1",
      { companyName: "Acme", primaryColor: "#ff0000" },
    );
    expect(result).toEqual(updated);
    expect(mockPrisma.client.deliveryNoteConfig.upsert).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
      update: { companyName: "Acme", primaryColor: "#ff0000" },
      create: {
        companyName: "Acme",
        primaryColor: "#ff0000",
        organizationId: "org-1",
      },
    });
  });

  it("should throw NotFoundException when transaction does not exist", async () => {
    mockPrisma.client.transaction.findFirst.mockResolvedValue(null);

    await expect(
      useCase.getDocumentStream("invoice", "non-existent-id", "org-1"),
    ).rejects.toThrow();
  });
});
