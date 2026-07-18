import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db";
import { env } from "@repo/env";
import { cookies } from "next/headers";
import { handleZitadelCallback } from "@/app/lib/zitadel-auth";
import { randomBytes, randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing authorization code or state parameter." }, { status: 400 });
  }

  // 1. Verify CSRF State
  const cookieStore = await cookies();
  const savedState = cookieStore.get("zitadel_auth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.json({ error: "Invalid state. CSRF token mismatch." }, { status: 403 });
  }

  // Clear CSRF state cookie
  cookieStore.delete("zitadel_auth_state");

  let orgSlug = "";
  try {
    const statePayload = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    orgSlug = statePayload.orgSlug;
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse state payload." }, { status: 400 });
  }

  if (!orgSlug) {
    return NextResponse.json({ error: "Missing organization identifier in state." }, { status: 400 });
  }

  // 2. Fetch Organization
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    include: { zitadelConfiguration: true }
  });

  if (!org) {
    return NextResponse.json({ error: "Associated organization not found." }, { status: 404 });
  }

  const config = org.zitadelConfiguration;
  if (!config || !config.isActive) {
    return NextResponse.json({ error: "Zitadel configuration is inactive or missing for this organization." }, { status: 400 });
  }

  const zitadelDomain = env.ZITADEL_DOMAIN || "auth.scryme.tech";
  const clientId = config.zitadelAppId || env.ZITADEL_CLIENT_ID || "mock-client-id";
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";
  const redirectUri = `${appUrl}/api/auth/callback/zitadel`;

  let user: any = null;
  let customerId: string | null = null;

  const isProduction = (process.env.NODE_ENV as string) === "production" || (env.NODE_ENV as string) === "production";

  // 3. Handle Token Exchange (Mock / Real)
  const isMockMode = !isProduction && (clientId.includes("mock") || code === "mock-code" || !env.ZITADEL_DOMAIN);

  if (isMockMode) {
    // Elegant fallback: create / associate mock profile (Strictly restricted to non-production environments)
    const email = "b2b-customer@mock.com";
    let customer = await db.customer.findUnique({
      where: { organizationId_email: { organizationId: org.id, email } }
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: "Mock B2B Customer",
          email,
          organizationId: org.id,
          company: "Mock B2B Enterprise"
        }
      });
    }

    user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: "Mock B2B Customer",
          activeOrganizationId: org.id,
          customerId: customer.id,
          organizationId: org.id
        }
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          activeOrganizationId: org.id,
          customerId: customer.id,
          organizationId: org.id
        }
      });
    }
    customerId = customer.id;
  } else {
    // Real Zitadel OIDC Token Exchange
    try {
      const tokenParams = new URLSearchParams();
      tokenParams.append("grant_type", "authorization_code");
      tokenParams.append("code", code);
      tokenParams.append("redirect_uri", redirectUri);
      tokenParams.append("client_id", clientId);

      const tokenRes = await fetch(`https://${zitadelDomain}/oauth/v2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: tokenParams.toString()
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Token exchange failed: ${tokenRes.statusText} - ${errorText}`);
      }

      const tokenData = await tokenRes.json();
      const idToken = tokenData.id_token || tokenData.access_token;

      if (!idToken) {
        throw new Error("No token returned from token endpoint.");
      }

      // Safe verify and db insert via handleZitadelCallback
      const callbackResult = await handleZitadelCallback(org.id, idToken, zitadelDomain, clientId);
      user = callbackResult.user;
      customerId = callbackResult.customerId;

      // Ensure user record is updated with scopes
      await db.user.update({
        where: { id: user.id },
        data: {
          activeOrganizationId: org.id,
          customerId: customerId,
          organizationId: org.id
        }
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Authentication failed: ${err.message}` }, { status: 500 });
    }
  }

  // 4. Create cryptographically secure session direct in database to ensure full type-safety and 100% reliability
  try {
    const sessionId = "zitadel_session_" + randomUUID();
    const sessionToken = "zitadel_token_" + randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.session.create({
      data: {
        id: sessionId,
        token: sessionToken,
        userId: user.id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        activeOrganizationId: org.id
      }
    });

    // Return Redirect response with secure HTTP-only cookie set
    const response = NextResponse.redirect(new URL(`/${orgSlug}/dashboard`, request.url));
    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: (process.env.NODE_ENV as string) === "production",
      path: "/",
      expires: expiresAt
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: `Session creation failed: ${err.message}` }, { status: 500 });
  }
}
