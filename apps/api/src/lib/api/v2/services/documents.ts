import { prisma as db } from "@repo/db";
import { Mappers, generateQRCode, DocumentGenerator } from "@repo/documents";

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
  const transaction: any = await db.transaction.findFirst({
    where: {
      id,
      organizationId: orgId,
    },
    select: {
      id: true,
      number: true,
      createdAt: true,
      notes: true,
      subtotal: true,
      taxTotal: true,
      finalTotal: true,
      discountTotal: true,
      shippingTotal: true,
      expiresAt: true,
      status: true,
      tags: true,
      currencyCode: true,
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          subtotal: true,
          sku: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              id: true,
              street1: true,
              street2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              isDefault: true,
            },
          },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
          description: true,
          settings: {
            select: {
              defaultCurrency: true,
              defaultTimezone: true,
              defaultInvoiceTemplate: true,
            },
          },
          invoiceConfig: {
            select: {
              showLogo: true,
              logoUrl: true,
              companyName: true,
              companyAddress: true,
              companyPhone: true,
              companyEmail: true,
              invoiceNumberPrefix: true,
              invoiceNumberSuffix: true,
              invoiceNumberPadding: true,
              defaultNotes: true,
              defaultTerms: true,
              footerText: true,
            },
          },
          receiptConfig: {
            select: {
              showLogo: true,
              logoUrl: true,
              companyName: true,
              companyAddress: true,
              companyPhone: true,
              companyEmail: true,
            },
          },
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          contact: true,
        },
      },
      member: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          method: true,
          amount: true,
          amountReceived: true,
          change: true,
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

  const { getInvoiceTemplate, ReceiptTemplateV2 } =
    await import("@repo/documents");

  switch (type) {
    case "invoice": {
      const selectedTemplate =
        template || transaction.organization?.settings?.defaultInvoiceTemplate;
      DocumentComponent = getInvoiceTemplate(selectedTemplate);
      data = Mappers.toInvoiceData({ ...transaction, dueDate: transaction.expiresAt });
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
      data = Mappers.toReceiptData(transaction);
      filename = `Receipt_${transaction.number}.pdf`;
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
