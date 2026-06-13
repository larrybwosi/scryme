import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { createElement } from "react";
import { StockTransferListTemplate, DocumentGenerator } from "@repo/documents";
import { getStockTransferList } from "@/app/actions/stock-management";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const organization = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { name: true, logo: true }
  });

  const transfers = await getStockTransferList({ search, status });

  const documentData = {
    organizationName: organization?.name || "Organization",
    logoUrl: organization?.logo || undefined,
    transfers: transfers.map(trf => ({
      transferNumber: trf.transferNumber,
      fromLocation: trf.fromLocation.name,
      toLocation: trf.toLocation.name,
      requestedDate: format(new Date(trf.requestedDate), "MMM dd, yyyy"),
      requestedBy: trf.requestedBy.user.name || "N/A",
      status: trf.status,
    }))
  };

  try {
    const stream = await DocumentGenerator.renderToStream(
      createElement(StockTransferListTemplate as any, { data: documentData } as any) as any
    );

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="stock-transfers-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
