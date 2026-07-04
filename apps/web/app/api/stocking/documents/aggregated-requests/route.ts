import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { createElement } from "react";
import { AggregatedStockRequestListV3, DocumentGenerator } from "@repo/documents";
import { getAggregatedStockRequests } from "@/app/actions/stock-management";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const locationId = searchParams.get("locationId") || undefined;
  const level = searchParams.get("level") || "organization";
  const generatedBy = searchParams.get("generatedBy") || undefined;

  const organization = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: { name: true, logo: true },
  });

  let branchName: string | undefined;
  if (level === "branch" && locationId) {
    const location = await db.inventoryLocation.findUnique({
      where: { id: locationId },
      select: { name: true },
    });
    branchName = location?.name;
  }

  const items = await getAggregatedStockRequests({
    search,
    locationId: level === "branch" ? locationId : undefined,
  });

  const documentData = {
    organizationName: organization?.name || "Organization",
    logoUrl: organization?.logo || undefined,
    primaryColor: "#0f172a",
    generatedBy,
    branchName,
    periodLabel: format(new Date(), "MMMM yyyy"),
    items: items.map(item => ({
      sku: item.sku,
      name: item.name,
      variantName: item.variantName || "",
      totalRequested: item.totalRequested,
      totalAllocated: item.totalAllocated,
      totalRemaining: item.totalRemaining,
    })),
  };

  try {
    const stream = await DocumentGenerator.renderToStream(
      createElement(
        AggregatedStockRequestListV3 as any,
        { data: documentData } as any,
      ) as any,
    );

    const filename =
      level === "branch" && branchName
        ? `compiled-stock-requests-${branchName.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
        : `compiled-stock-requests-org-${format(new Date(), "yyyy-MM-dd")}.pdf`;

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
