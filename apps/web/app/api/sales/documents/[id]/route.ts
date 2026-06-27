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
    include: {
      attachments: true,
      fulfillments: {
        include: { shippingAddress: true },
      },
      customer: {
        include: {
          addresses: true,
        },
      },
      items: true,
      organization: {
        include: {
          settings: true,
        },
      },
      location: true,
      payments: true,
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
