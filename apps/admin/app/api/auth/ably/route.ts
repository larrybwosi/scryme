import { NextRequest, NextResponse } from "next/server";
import { ably } from "@repo/shared/ably";
import { getOrganizationContext } from "../../../actions/auth";

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext();

    if (!context || !context.user || !context.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, user } = context;
    const memberId = user.id;

    const paymentChannel = `organization:${organizationId}:payments`;
    const notificationChannel = `organization:${organizationId}:notifications`;
    const organizationChannel = `organization:${organizationId}:*`;

    const tokenRequest = await ably.auth.requestToken({
      clientId: memberId,
      capability: JSON.stringify({
        "order-*": ["subscribe", "publish"],
        "cashier-notifications": ["subscribe"],
        "channel:*": ["subscribe", "publish", "history"],
        "session:*": ["subscribe", "publish", "history"],
        "system:*": ["subscribe", "publish", "history"],
        "presence:*": ["subscribe", "publish", "history", "presence"],
        "store:*": ["subscribe", "publish", "history", "presence"],
        [paymentChannel]: ["subscribe"],
        [notificationChannel]: ["subscribe"],
        [organizationChannel]: ["subscribe", "publish", "history", "presence"],
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
