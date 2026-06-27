import { NextResponse } from "next/server";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";

export async function GET() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, scrymeConfig] = await Promise.all([
    db.windmillConfiguration.findUnique({
      where: { organizationId: auth.organizationId },
    }),
    db.scrymeConfiguration.findUnique({
      where: { organizationId: auth.organizationId },
    }),
  ]);

  if (!config && !scrymeConfig) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    windmillBaseUrl: config?.windmillBaseUrl,
    windmillApiKeyMasked: config?.windmillApiKey ? "••••••••••••••••" : null,
    webhookSecretMasked: config?.webhookSecret ? "••••••••••••••••" : null,
    workspaceId: config?.workspaceId,
    workspaceName: config?.workspaceName,
    scrymeChatWorkspaceId: scrymeConfig?.workspaceId,
    scrymeChatWorkspaceSlug: scrymeConfig?.workspaceSlug,
    isActive: config?.isActive || scrymeConfig?.isActive,
  });
}

export async function POST(req: Request) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { windmillBaseUrl, windmillApiKey, webhookSecret } = body;

  await db.windmillConfiguration.upsert({
    where: { organizationId: auth.organizationId },
    update: {
      windmillBaseUrl,
      windmillApiKey: windmillApiKey || undefined,
      webhookSecret: webhookSecret || undefined,
    },
    create: {
      organizationId: auth.organizationId,
      windmillBaseUrl,
      windmillApiKey: windmillApiKey || "",
      webhookSecret: webhookSecret || "",
    },
  });

  return NextResponse.json({ success: true });
}
