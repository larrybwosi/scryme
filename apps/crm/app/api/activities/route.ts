import { NextResponse } from "next/server";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";

export async function GET(request: Request) {
  const auth = await getServerAuth();

  if (!auth?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activities = await db.crmActivity.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        record: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json([], { status: 500 });
  }
}
