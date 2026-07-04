import { Injectable } from "@nestjs/common";
import {
  DocumentGenerator,
  StockRequestTemplate,
  StockRequestPDFData,
  StockTransferTemplate,
  StockTransferPDFData,
  InvoiceTemplate,
  GenericInvoiceData,
  ReceiptTemplateV2,
  ReceiptPDFDataV2,
  getTemplateById,
  V3DocumentData,
} from "@repo/documents";
import { generateVerificationHash } from "@repo/documents/server";
import { Readable } from "stream";

@Injectable()
export class DocumentService {
  async generateStockRequestPDF(data: StockRequestPDFData): Promise<Readable> {
    const element = DocumentGenerator.createElement(StockRequestTemplate, {
      data,
    });
    return (await DocumentGenerator.renderToStream(
      element,
    )) as unknown as Readable;
  }

  async generateStockTransferPDF(
    data: StockTransferPDFData,
  ): Promise<Readable> {
    const element = DocumentGenerator.createElement(StockTransferTemplate, {
      data,
    });
    return (await DocumentGenerator.renderToStream(
      element,
    )) as unknown as Readable;
  }

  async generateReconciliationReport(
    reconciliationId: string,
  ): Promise<Readable> {
    const element = DocumentGenerator.createElement(
      DocumentGenerator.Document,
      null,
      DocumentGenerator.createElement(
        DocumentGenerator.Page,
        null,
        DocumentGenerator.createElement(
          DocumentGenerator.Text,
          null,
          `Reconciliation Report: ${reconciliationId}`,
        ),
      ),
    );
    return (await DocumentGenerator.renderToStream(
      element,
    )) as unknown as Readable;
  }
  async generateInvoicePDF(data: GenericInvoiceData): Promise<Readable> {
    // Generate verification hash if not present
    if (!data.verificationHash) {
      data.verificationHash = generateVerificationHash({
        invoiceNumber: data.invoiceNumber,
        grandTotal: data.total,
        date: String(data.date),
        organizationName: data.branding?.companyName || "Organization",
      });
    }
    const element = DocumentGenerator.createElement(InvoiceTemplate, { data });
    return (await DocumentGenerator.renderToStream(
      element,
    )) as unknown as Readable;
  }

  async generateReceiptPDF(data: ReceiptPDFDataV2): Promise<Readable> {
    const element = DocumentGenerator.createElement(ReceiptTemplateV2, {
      data,
    });
    return (await DocumentGenerator.renderToStream(
      element,
    )) as unknown as Readable;
  }

  async generateV3DocumentPDF(
    templateId: string,
    data: V3DocumentData,
    qrCode?: string,
  ): Promise<Readable> {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const element = DocumentGenerator.createElement(template.component, {
      data,
      qrCode,
    });
    return (await DocumentGenerator.renderToStream(
      element,
    )) as unknown as Readable;
  }
}
