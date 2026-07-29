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

  if (["invoice", "receipt", "waybill", "delivery-note", "packing-list"].includes(type)) {
    try {
      const { generateDocumentToken } = await import("@repo/shared/api/v2");
      const token = generateDocumentToken(type as any, id, auth.organizationId);

      const defaultApiUrl = "http://localhost:3002";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

      let fetchUrl = "";
      if (type === "invoice") {
        fetchUrl = `${apiUrl}/api/v3/public-invoices/transactions/${id}/download?token=${token}`;
      } else if (type === "receipt") {
        fetchUrl = `${apiUrl}/api/v3/public-invoices/receipts/${id}/download?token=${token}`;
      } else {
        fetchUrl = `${apiUrl}/api/v2/public/documents/${type}/${id}?token=${token}`;
      }

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

  return new NextResponse("Unsupported document type", { status: 400 });
}
