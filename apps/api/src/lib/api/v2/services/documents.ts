import {prisma as db} from "@repo/db";
import {Mappers} from "@repo/documents/server";
import {renderToStream} from "@react-pdf/renderer";
import React from "react";
import QRCode from "qrcode";

export async function generateDocument(type: string, data: any): Promise<any> {
  return Buffer.from([]);
}

export async function getDocumentStream(
  type: "invoice" | "waybill" | "receipt" | "quote",
  id: string,
  orgId?: string,
  format: "A4" | "80MM" | "58MM" = "A4",
  template?: string,
): Promise<{
  stream: NodeJS.ReadableStream;
  filename: string;
  contentType: string;
}> {
  const transaction = await db.transaction.findFirst({
    where: {
      id,
      organizationId: orgId,
    },
    include: {
      organization: {
        include: {
          settings: true,
        },
      },
      customer: {
        include: {
          addresses: true,
        },
      },
      items: true,
      payments: true,
      location: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  let DocumentComponent: React.ComponentType<any>;
  let data: any;
  let filename: string;
  let qrCode: string = "";

  const {getInvoiceTemplate, ReceiptTemplateV2} =
    await import("@repo/documents");

  switch (type) {
    case "invoice": {
      const selectedTemplate =
        template || transaction.organization?.settings?.defaultInvoiceTemplate;
      DocumentComponent = getInvoiceTemplate(selectedTemplate);
      data = Mappers.toInvoiceData(transaction);
      filename = `Invoice_${transaction.number}.pdf`;

      try {
        // Generate QR code for invoice number (or verification URL if available)
        qrCode = await QRCode.toDataURL(transaction.number);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
      break;
    }
    case "receipt":
      DocumentComponent = ReceiptTemplateV2;
      data = Mappers.toReceiptData(transaction);
      filename = `Receipt_${transaction.number}.pdf`;
      break;
    default:
      throw new Error(`Document type ${type} not supported yet`);
  }

  const stream = await renderToStream(
    React.createElement(DocumentComponent, {
      data,
      qrCode,
      settings: transaction.organization?.settings,
    }),
  );

  return {
    stream,
    filename,
    contentType: "application/pdf",
  };
}

export enum DocumentType {
  INVOICE = "INVOICE",
  RECEIPT = "RECEIPT",
}

export enum DocumentFormat {
  PDF = "PDF",
  HTML = "HTML",
}
