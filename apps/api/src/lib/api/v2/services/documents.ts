import { prisma as db } from "@repo/db";
import { Mappers, generateQRCode, DocumentGenerator } from "@repo/documents";

export async function generateDocument(type: string, data: any): Promise<any> {
  return Buffer.from([]);
}

export async function getDocumentStream(
  type: "invoice" | "waybill" | "receipt" | "quote" | "packing-list" | "delivery-note",
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
      fulfillments: {
        include: {
          shippingAddress: true,
          driver: {
            include: {
              member: true,
            },
          },
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  let DocumentComponent: any;
  let data: any;
  let filename: string;
  let qrCode: string = "";

  const {
    getInvoiceTemplate,
    ReceiptTemplateV2,
    WaybillV3Document,
    DeliveryNoteV3Document,
    PackingListDocument,
  } = await import("@repo/documents");

  switch (type) {
    case "invoice": {
      const selectedTemplate =
        template || transaction.organization?.settings?.defaultInvoiceTemplate;
      DocumentComponent = getInvoiceTemplate(selectedTemplate);
      data = Mappers.toInvoiceData(transaction as any);
      filename = `Invoice_${transaction.number}.pdf`;

      try {
        // Generate QR code for invoice number (or verification URL if available)
        qrCode = await generateQRCode(transaction.number);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
      break;
    }
    case "receipt":
      DocumentComponent = ReceiptTemplateV2;
      data = Mappers.toReceiptData(transaction as any);
      filename = `Receipt_${transaction.number}.pdf`;
      break;
    case "waybill":
      DocumentComponent = WaybillV3Document;
      data = Mappers.toWaybillData(transaction as any, transaction.fulfillments?.[0]);
      filename = `Waybill_${transaction.number}.pdf`;
      break;
    case "delivery-note":
      DocumentComponent = DeliveryNoteV3Document;
      data = Mappers.toDeliveryNoteData(transaction as any, transaction.fulfillments?.[0]);
      filename = `DeliveryNote_${transaction.number}.pdf`;
      break;
    case "packing-list":
      DocumentComponent = PackingListDocument;
      // @ts-ignore
      data = Mappers.toPackingListData(transaction as any, transaction.fulfillments?.[0]);
      filename = `PackingList_${transaction.number}.pdf`;
      break;
    default:
      throw new Error(`Document type ${type} not supported yet`);
  }

  const stream = (await DocumentGenerator.renderToStream(
    DocumentGenerator.createElement(DocumentComponent, {
      data,
      qrCode,
      settings: transaction.organization?.settings,
    }),
  )) as NodeJS.ReadableStream;

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
