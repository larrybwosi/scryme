import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { renderToStream } from "@react-pdf/renderer";
import { createElement } from "react";
import { Mappers } from "@repo/documents/server";
import { getInvoiceTemplate, ReceiptTemplateV2 } from "@repo/documents";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type") || "invoice"; // invoice or receipt
  const template = searchParams.get("template");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      organizationId: auth.organizationId,
    },
    include: {
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
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    let stream;
    if (type === "receipt") {
      const documentData = Mappers.toReceiptData(transaction);
      stream = await renderToStream(
        createElement(
          ReceiptTemplateV2 as any,
          { data: documentData } as any,
        ) as any,
      );
    } else {
      const selectedTemplate = template || transaction.organization?.settings?.defaultInvoiceTemplate;
      const DocumentComponent = getInvoiceTemplate(selectedTemplate);
      const documentData = Mappers.toInvoiceData(transaction);

      let qrCode = "";
      try {
        qrCode = await QRCode.toDataURL(transaction.number);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }

      stream = await renderToStream(
        createElement(
          DocumentComponent as any,
          { data: documentData, qrCode } as any,
        ) as any,
      );
    }

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}-${transaction.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}