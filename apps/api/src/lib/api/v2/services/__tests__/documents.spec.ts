import { getDocumentStream } from "../documents";
import { prisma } from "@repo/db";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/db", () => {
  const mockFindFirst = vi.fn();
  const mockStockFindFirst = vi.fn();
  return {
    prisma: {
      transaction: {
        findFirst: mockFindFirst,
      },
      stockTransfer: {
        findFirst: mockStockFindFirst,
      },
    },
    PrismaClient: vi.fn().mockImplementation(() => ({
      transaction: {
        findFirst: mockFindFirst,
      },
      stockTransfer: {
        findFirst: mockStockFindFirst,
      },
    })),
  };
});

vi.mock("@repo/documents", async importOriginal => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    DocumentGenerator: {
      ...actual.DocumentGenerator,
      renderToStream: vi.fn().mockResolvedValue("mock-stream"),
      createElement: vi.fn().mockReturnValue({}),
    },
    generateQRCode: vi.fn().mockResolvedValue("mock-qrcode"),
  };
});

vi.mock("@repo/documents/templates/v2/InvoiceTemplate", () => ({
  InvoiceTemplate: () => null,
}));

vi.mock("@repo/documents/templates/v2/ReceiptTemplate", () => ({
  ReceiptTemplate: () => null,
}));

describe("Documents Service", () => {
  it("should return a stream for an invoice", async () => {
    const mockTransaction = {
      id: "txn_1",
      number: "INV-001",
      createdAt: new Date(),
      organization: { settings: {} },
      customer: { addresses: [] },
      items: [],
      payments: [],
      location: {},
    };

    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(
      mockTransaction as any,
    );

    const result = await getDocumentStream("invoice", "txn_1", "org_1");

    expect(result.stream).toBe("mock-stream");
    expect(result.filename).toBe("Invoice_INV-001.pdf");
    expect(result.contentType).toBe("application/pdf");
  });

  it("should throw error if transaction not found", async () => {
    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);

    await expect(
      getDocumentStream("invoice", "txn_2", "org_1"),
    ).rejects.toThrow("Transaction not found");
  });

  it("should return a stream for stock transfer packing list", async () => {
    const mockTransfer = {
      id: "trf_1",
      transferNumber: "TRF-001",
      requestedDate: new Date(),
      status: "PENDING_APPROVAL",
      organization: { settings: {} },
      fromLocation: { name: "Loc A" },
      toLocation: { name: "Loc B" },
      items: [
        {
          id: "item_1",
          requestedQuantity: 5,
          variant: {
            sku: "SKU-001",
            name: "V1",
            product: { name: "Prod 1" },
          },
        },
      ],
    };

    vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);
    vi.mocked((prisma as any).stockTransfer.findFirst).mockResolvedValue(
      mockTransfer as any,
    );

    const result = await getDocumentStream("packing-list", "trf_1", "org_1");

    expect(result.stream).toBe("mock-stream");
    expect(result.filename).toBe("PackingList_TRF-001.pdf");
    expect(result.contentType).toBe("application/pdf");
  });
});
