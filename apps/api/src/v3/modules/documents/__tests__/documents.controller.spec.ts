import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DocumentsController,
  PublicDocumentsController,
} from "../interfaces/http/documents.controller";
import { DocumentsUseCase } from "../../application/documents.use-case";
import { Readable } from "stream";
import * as sharedV3 from "@repo/shared/api/v3";

vi.mock("@repo/shared/api/v3", () => ({
  verifyDocumentToken: vi.fn(),
}));

describe("DocumentsController & PublicDocumentsController", () => {
  let documentsController: DocumentsController;
  let publicController: PublicDocumentsController;
  let mockUseCase: any;

  beforeEach(() => {
    mockUseCase = {
      getDocumentStream: vi.fn().mockResolvedValue({
        stream: new Readable({
          read() {
            this.push(null);
          },
        }),
        filename: "invoice-INV-001.pdf",
        contentType: "application/pdf",
      }),
      getDocumentConfig: vi.fn().mockResolvedValue({
        organizationId: "org-1",
        companyName: "Acme Corp",
      }),
      updateDocumentConfig: vi.fn().mockResolvedValue({
        organizationId: "org-1",
        companyName: "Acme Corp Updated",
      }),
    };

    documentsController = new DocumentsController(
      mockUseCase as unknown as DocumentsUseCase,
    );
    publicController = new PublicDocumentsController(
      mockUseCase as unknown as DocumentsUseCase,
    );
  });

  it("should stream authenticated document and set response headers", async () => {
    const mockReq = { organization: { id: "org-1" } };
    const mockRes = {
      header: vi.fn(),
    };

    const file = await documentsController.getDocument(
      mockReq,
      "invoice",
      "tx-123",
      "invoice-v2",
      "A4",
      mockRes as any,
    );

    expect(mockUseCase.getDocumentStream).toHaveBeenCalledWith(
      "invoice",
      "tx-123",
      "org-1",
      { template: "invoice-v2", format: "A4" },
    );
    expect(mockRes.header).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );
    expect(mockRes.header).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="invoice-INV-001.pdf"',
    );
    expect(file).toBeDefined();
  });

  it("should stream public document when token is valid", async () => {
    (sharedV3.verifyDocumentToken as any).mockReturnValue({
      type: "receipt",
      id: "tx-456",
      orgId: "org-1",
    });

    const mockRes = {
      header: vi.fn(),
    };

    const file = await publicController.getPublicDocument(
      "receipt",
      "tx-456",
      "valid-token",
      "",
      "A4",
      "true",
      mockRes as any,
    );

    expect(mockUseCase.getDocumentStream).toHaveBeenCalledWith(
      "receipt",
      "tx-456",
      "org-1",
      { template: "", format: "A4" },
    );
    expect(mockRes.header).toHaveBeenCalledWith(
      "Content-Disposition",
      'inline; filename="invoice-INV-001.pdf"',
    );
    expect(file).toBeDefined();
  });

  it("should reject public document when token does not match type or id", async () => {
    (sharedV3.verifyDocumentToken as any).mockReturnValue({
      type: "invoice",
      id: "different-id",
      orgId: "org-1",
    });

    const mockRes = { header: vi.fn() };

    await expect(
      publicController.getPublicDocument(
        "receipt",
        "tx-456",
        "invalid-token",
        "",
        "A4",
        "false",
        mockRes as any,
      ),
    ).rejects.toThrow();
  });
});
