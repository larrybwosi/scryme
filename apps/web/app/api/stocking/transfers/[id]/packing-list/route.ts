import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { generateDocumentToken } from "@repo/shared/api/v2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Verify that the stock transfer exists and belongs to this organization
  const transfer = await db.stockTransfer.findUnique({
    where: {
      id,
      organizationId: auth.organizationId,
    },
  });

  if (!transfer) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const token = generateDocumentToken("packing-list", id, auth.organizationId);

    const defaultApiUrl = "http://localhost:3002";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
    const fetchUrl = `${apiUrl}/api/v2/public/documents/packing-list/${id}?token=${token}`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch packing-list from API: ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="packing-list-${transfer.transferNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error delegating stock transfer packing-list generation to API:", error);
    return new NextResponse("Error generating packing list", { status: 500 });
  }
}
