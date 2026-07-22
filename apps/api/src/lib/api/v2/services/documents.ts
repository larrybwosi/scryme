import { prisma as db } from "@repo/db";
import { Mappers, generateQRCode, DocumentGenerator, resolveBranding, formatAddress } from "@repo/documents";

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
  let transaction = await db.transaction.findFirst({
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

  let transfer: any = null;
  let isStockTransfer = false;

  if (!transaction) {
    transfer = await db.stockTransfer.findFirst({
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
        fromLocation: true,
        toLocation: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (transfer) {
      isStockTransfer = true;
    }
  }

  if (!transaction && !transfer) {
    throw new Error("Document not found");
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
      if (isStockTransfer) {
        throw new Error("Invoice is not supported for stock transfer");
      }
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
      if (isStockTransfer) {
        throw new Error("Receipt is not supported for stock transfer");
      }
      DocumentComponent = ReceiptTemplateV2;
      data = Mappers.toReceiptData(transaction as any);
      filename = `Receipt_${transaction.number}.pdf`;
      break;
    case "waybill":
      if (isStockTransfer) {
        throw new Error("Waybill is not supported for stock transfer");
      }
      DocumentComponent = WaybillV3Document;
      data = Mappers.toWaybillData(transaction as any, transaction.fulfillments?.[0]);
      filename = `Waybill_${transaction.number}.pdf`;
      break;
    case "delivery-note":
      if (isStockTransfer) {
        throw new Error("Delivery note is not supported for stock transfer");
      }
      DocumentComponent = DeliveryNoteV3Document;
      data = Mappers.toDeliveryNoteData(transaction as any, transaction.fulfillments?.[0]);
      filename = `DeliveryNote_${transaction.number}.pdf`;
      break;
    case "packing-list":
      if (isStockTransfer) {
        DocumentComponent = PackingListDocument;
        const branding = resolveBranding(transfer.organization, transfer.organization?.waybillConfig);
        data = {
          id: transfer.id,
          number: `PL-${transfer.transferNumber}`,
          orderNumber: transfer.transferNumber,
          date: transfer.requestedDate || new Date(),
          branding,
          customer: {
            name: transfer.toLocation.name,
            address: transfer.toLocation.address ? formatAddress(transfer.toLocation.address) : undefined,
          },
          shippingAddress: transfer.toLocation.address ? formatAddress(transfer.toLocation.address) : transfer.toLocation.name,
          items: (transfer.items || []).map((item: any) => ({
            id: item.id,
            sku: item.variant?.sku || undefined,
            description: `${item.variant?.product?.name || "Item"}${item.variant?.name ? ` - ${item.variant.name}` : ""}`,
            quantity: Number(item.requestedQuantity || 0),
            quantityPacked: item.shippedQuantity ? Number(item.shippedQuantity) : Number(item.requestedQuantity || 0),
          })),
          notes: transfer.notes || undefined,
        };
        filename = `PackingList_${transfer.transferNumber}.pdf`;
      } else {
        DocumentComponent = PackingListDocument;
        data = Mappers.toPackingListData(transaction as any, transaction.fulfillments?.[0]);
        filename = `PackingList_${transaction.number}.pdf`;
      }
      break;
    default:
      throw new Error(`Document type ${type} not supported yet`);
  }

  const stream = (await DocumentGenerator.renderToStream(
    DocumentGenerator.createElement(DocumentComponent, {
      data,
      qrCode,
      settings: isStockTransfer ? transfer.organization?.settings : transaction.organization?.settings,
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
