import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { createElement } from "react";
import { StockRequestListTemplate, DocumentGenerator } from "@repo/documents";
import { getStockRequestList } from "@/app/actions/stock-management";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const organization = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { name: true, logo: true },
  });

  const requests = await getStockRequestList({ search, status });

  const documentData = {
    organizationName: organization?.name || "Organization",
    logoUrl: organization?.logo || undefined,
    requests: requests.map(req => ({
      requestNumber: req.requestNumber,
      requestDate: format(new Date(req.requestDate), "MMM dd, yyyy"),
      location: req.toLocation.name,
      itemsCount: req._count.items,
      priority: req.priority,
      status: req.status,
      estimatedCost: `${req.totalEstimatedCost.toLocaleString()} KES`,
    })),
  };

  try {
    const stream = await DocumentGenerator.renderToStream(
      createElement(
        StockRequestListTemplate as any,
        { data: documentData } as any,
      ) as any,
    );

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="stock-requests-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
