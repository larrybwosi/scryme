import { NextRequest, NextResponse } from "next/server";
import { ably } from "@repo/shared/ably";
import { getCurrentAdmin } from "../../../actions/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminChannel = `admin:*`;

    const tokenRequest = await ably.auth.requestToken({
      clientId: user.id,
      capability: JSON.stringify({
        [adminChannel]: ["subscribe", "publish", "history", "presence"],
      }),
      ttl: 3600 * 1000,
      timestamp: Date.now(),
    });

    return NextResponse.json(tokenRequest);
  } catch (error: any) {
    console.error("Ably auth error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
