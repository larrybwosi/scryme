import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { renderToStream } from "@react-pdf/renderer";
import { createElement } from "react";
import { Mappers, DeliveryNoteDocument } from "@repo/documents/server";

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
    },
  });

  if (!transaction) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (type === "invoice" || type === "receipt") {
    try {
      const { generateDocumentToken } = await import("@repo/shared/api/v2");
      const token = generateDocumentToken(type, id, auth.organizationId);

      const defaultApiUrl = "http://localhost:3002";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
      const fetchUrl =
        type === "invoice"
          ? `${apiUrl}/api/v3/public-invoices/transactions/${id}/download?token=${token}`
          : `${apiUrl}/api/v3/public-invoices/receipts/${id}/download?token=${token}`;

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${type} from API: ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type}-${transaction.number}.pdf"`,
        },
      });
    } catch (error) {
      console.error(`Error delegating ${type} generation to API:`, error);
      return new NextResponse(`Error generating ${type}`, { status: 500 });
    }
  }

  if (type === "delivery-note") {
    try {
      const fullTransaction = await db.transaction.findUnique({
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

      if (!fullTransaction) {
        return new NextResponse("Not Found", { status: 404 });
      }

      const documentData = Mappers.toDeliveryNoteData(
        fullTransaction,
        fullTransaction.fulfillments[0],
      );
      const stream = await renderToStream(
        createElement(
          DeliveryNoteDocument as any,
          { data: documentData } as any,
        ) as any,
      );

      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type}-${transaction.number}.pdf"`,
        },
      });
    } catch (error) {
      console.error("PDF Generation Error (Delivery Note):", error);
      return new NextResponse("Error generating PDF", { status: 500 });
    }
  }

  return new NextResponse("Unsupported document type", { status: 400 });
}
