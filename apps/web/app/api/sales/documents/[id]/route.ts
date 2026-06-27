import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { renderToStream } from "@react-pdf/renderer";
import { createElement } from "react";
import { Mappers, DeliveryNoteDocument } from "@repo/documents/server";
import { getInvoiceTemplate, ReceiptTemplateV2 } from "@repo/documents";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type") || "invoice"; // invoice, receipt, or delivery-note
  const template = searchParams.get("template");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      organizationId: auth.organizationId,
    },
    select: {
      id: true,
      number: true,
      updatedAt: true,
      attachments: {
        select: {
          description: true,
          uploadedAt: true,
          fileUrl: true,
        },
      },
      fulfillments: {
        select: {
          id: true,
          createdAt: true,
          deliveryNotes: true,
          shippingAddress: {
            select: {
              id: true,
              name: true,
              phone: true,
              street: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
            },
          },
          driver: {
            select: {
              member: {
                select: {
                  name: true,
                },
              },
            },
          },
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
              street: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              isDefault: true,
            },
          },
        },
      },
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
      organization: {
        select: {
          id: true,
          name: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          description: true,
          primaryColor: true,
          settings: {
            select: {
              defaultCurrency: true,
              defaultTimezone: true,
              defaultInvoiceTemplate: true,
            },
          },
          waybillConfig: {
            select: {
              showLogo: true,
              logoUrl: true,
              companyName: true,
              companyAddress: true,
              companyPhone: true,
              companyEmail: true,
              companyWebsite: true,
              companyTagline: true,
              primaryColor: true,
              showPoweredBy: true,
              watermarkText: true,
              customFields: true,
            },
          },
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
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
    return new NextResponse("Not Found", { status: 404 });
  }

  // Check if an up-to-date document already exists
  const existingDoc = transaction.attachments?.find(
    a =>
      a.description === (type === "invoice" ? "Invoice" : "Receipt") &&
      new Date(a.uploadedAt) >= new Date(transaction.updatedAt),
  );

  if (existingDoc?.fileUrl && type !== "delivery-note") {
    const { storageService } = await import("@repo/shared/storage");
    const stream = await storageService.getDownloadStream(existingDoc.fileUrl);

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-${transaction.number}.pdf"`,
      },
    });
  }

  try {
    const { documentService } = await import(
      "@repo/shared/lib/services/document"
    );
    let stream;
    if (type === "receipt") {
      const attachment = await documentService.generateAndSaveReceipt(
        transaction.id,
        transaction.organizationId,
        auth.memberId || null,
      );
      const { storageService } = await import("@repo/shared/storage");
      stream = await storageService.getDownloadStream(attachment.fileUrl!);
    } else if (type === "delivery-note") {
      const documentData = Mappers.toDeliveryNoteData(
        transaction,
        transaction.fulfillments[0],
      );
      stream = await renderToStream(
        createElement(
          DeliveryNoteDocument as any,
          { data: documentData } as any,
        ) as any,
      );
    } else {
      const attachment = await documentService.generateAndSaveInvoice(
        transaction.id,
        transaction.organizationId,
        auth.memberId || null,
      );
      const { storageService } = await import("@repo/shared/storage");
      stream = await storageService.getDownloadStream(attachment.fileUrl!);
    }

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-${transaction.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
