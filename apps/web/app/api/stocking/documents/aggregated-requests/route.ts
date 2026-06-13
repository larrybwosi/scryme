import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { renderToStream } from "@react-pdf/renderer";
import { createElement } from "react";
import { AggregatedStockRequestListTemplate } from "@repo/documents";
import { getAggregatedStockRequests } from "@/app/actions/stock-management";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;

  const organization = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { name: true, logo: true }
  });

  const items = await getAggregatedStockRequests({ search });

  const documentData = {
    organizationName: organization?.name || "Organization",
    logoUrl: organization?.logo || undefined,
    items: items.map(item => ({
      sku: item.sku,
      name: item.name,
      variantName: item.variantName || "",
      totalRequested: item.totalRequested,
      totalAllocated: item.totalAllocated,
      totalRemaining: item.totalRemaining,
    }))
  };

  try {
    const stream = await renderToStream(
      createElement(AggregatedStockRequestListTemplate, { data: documentData })
    );

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="aggregated-stock-requests-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
