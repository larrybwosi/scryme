import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { renderToStream } from "@react-pdf/renderer";
import { createElement } from "react";
import { SimpleInvoicePDF, GenericReceiptDocument } from "@repo/documents";

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
  const type = searchParams.get("type") || "invoice"; // invoice or receipt

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      organizationId: auth.organizationId,
    },
    include: {
      customer: true,
      items: true,
      organization: true,
      location: true,
    },
  });

  if (!transaction) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Prepare data for templates
  const documentData: any = {
    invoiceNumber: transaction.number,
    date: transaction.createdAt,
    customer: {
      name: transaction.customer?.name || "Walk-in Customer",
      email: transaction.customer?.email,
      address: "", // Could fetch from customer addresses
    },
    items: transaction.items.map((item: any) => ({
      description: `${item.productName} - ${item.variantName}`,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.lineTotal),
    })),
    subtotal: Number(transaction.subtotal),
    tax: Number(transaction.taxTotal),
    discount: Number(transaction.discountTotal),
    total: Number(transaction.finalTotal),
    currency: transaction.currencyCode || "USD",
    organization: {
      name: transaction.organization.name,
      // logo: transaction.organization.logoUrl,
    },
  };

  try {
    let stream;
    if (type === "receipt") {
      // Using GenericReceiptDocument or similar from @repo/documents
      stream = await renderToStream(
        createElement(
          GenericReceiptDocument as any,
          { data: documentData } as any,
        ) as any,
      );
    } else {
      stream = await renderToStream(
        createElement(
          SimpleInvoicePDF as any,
          { data: documentData } as any,
        ) as any,
      );
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
