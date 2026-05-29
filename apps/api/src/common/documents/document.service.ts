import { Injectable } from '@nestjs/common';
import {
  DocumentGenerator,
  StockRequestTemplate,
  StockRequestPDFData,
  StockTransferTemplate,
  StockTransferPDFData,
  InvoiceTemplate,
  InvoicePDFData,
  ReceiptTemplateV2,
  ReceiptPDFDataV2
} from '@repo/documents';
import { generateVerificationHash } from '@repo/documents/server';
import { Readable } from 'stream';

@Injectable()
export class DocumentService {
  async generateStockRequestPDF(data: StockRequestPDFData): Promise<Readable> {
    const element = DocumentGenerator.createElement(StockRequestTemplate, { data });
    return (await DocumentGenerator.renderToStream(element)) as unknown as Readable;
  }

  async generateStockTransferPDF(data: StockTransferPDFData): Promise<Readable> {
    const element = DocumentGenerator.createElement(StockTransferTemplate, { data });
    return (await DocumentGenerator.renderToStream(element)) as unknown as Readable;
  }

  async generateReconciliationReport(reconciliationId: string): Promise<Readable> {
    const element = DocumentGenerator.createElement(DocumentGenerator.Document, null,
        DocumentGenerator.createElement(DocumentGenerator.Page, null,
            DocumentGenerator.createElement(DocumentGenerator.Text, null, `Reconciliation Report: ${reconciliationId}`)
        )
    );
    return (await DocumentGenerator.renderToStream(element)) as unknown as Readable;
  }
  async generateInvoicePDF(data: InvoicePDFData): Promise<Readable> {
    // Generate verification hash if not present
    if (!data.verificationHash) {
      data.verificationHash = generateVerificationHash({
        invoiceNumber: data.invoiceNumber,
        grandTotal: data.grandTotal,
        date: data.date,
        organizationName: data.organizationName
      });
    }
    const element = DocumentGenerator.createElement(InvoiceTemplate, { data });
    return (await DocumentGenerator.renderToStream(element)) as unknown as Readable;
  }

  async generateReceiptPDF(data: ReceiptPDFDataV2): Promise<Readable> {
    const element = DocumentGenerator.createElement(ReceiptTemplateV2, { data });
    return (await DocumentGenerator.renderToStream(element)) as unknown as Readable;
  }
}
