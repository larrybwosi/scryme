"use server";

import { getPortalSDK } from "./portal-sdk";
import { db } from "@repo/db";
import { env } from "@repo/env";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";

export async function getB2BProducts(orgSlug: string, query?: string) {
  const sdk = await getPortalSDK();
  const response = await sdk.b2b.getCatalog(orgSlug);

  const products = response || [];

  if (query) {
    const q = query.toLowerCase();
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  return products;
}

export async function startZitadelSSO(orgSlug: string) {
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    include: { zitadelConfiguration: true }
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const config = org.zitadelConfiguration;
  if (!config || !config.isActive) {
    throw new Error("Zitadel SSO is not configured or active for this organization.");
  }

  const zitadelDomain = env.ZITADEL_DOMAIN || "auth.scryme.tech";
  const clientId = config.zitadelAppId || env.ZITADEL_CLIENT_ID || "mock-client-id";
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";

  const redirectUri = `${appUrl}/api/auth/callback/zitadel`;
  const nonce = randomBytes(16).toString("hex");
  const statePayload = { orgSlug, nonce };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");

  // Save state in secure cookies
  const cookieStore = await cookies();
  cookieStore.set("zitadel_auth_state", state, {
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === "production",
    maxAge: 300, // 5 minutes
    path: "/"
  });

  const authUrl = `https://${zitadelDomain}/oauth/v2/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${encodeURIComponent(state)}`;

  redirect(authUrl);
}

export async function loginMockUser(orgSlug: string, email: string) {
  // STRICT SECURITY CHECK: Deny mock login in production environments
  if ((process.env.NODE_ENV as string) === "production" || (env.NODE_ENV as string) === "production") {
    throw new Error("Mock bypass authentication is not permitted in production environments.");
  }

  // Safe validation
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email address");
  }

  const org = await db.organization.findUnique({
    where: { slug: orgSlug }
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  // Find or create B2B customer context
  let customer = await db.customer.findUnique({
    where: { organizationId_email: { organizationId: org.id, email } }
  });

  if (!customer) {
    customer = await db.customer.create({
      data: {
        name: email.split("@")[0],
        email,
        organizationId: org.id,
        company: "Mock Company"
      }
    });
  }

  // Find or create user
  let user = await db.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: email.split("@")[0],
        activeOrganizationId: org.id,
        customerId: customer.id,
        organizationId: org.id
      }
    });
  } else {
    // Make sure fields are populated
    user = await db.user.update({
      where: { id: user.id },
      data: {
        activeOrganizationId: org.id,
        customerId: customer.id,
        organizationId: org.id
      }
    });
  }

  // Cryptographically secure session generation
  const sessionId = randomUUID();
  const sessionToken = randomBytes(32).toString("hex");
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

  // Set better-auth session cookie
  const cookieStore = await cookies();
  cookieStore.set("better-auth.session_token", sessionToken, {
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === "production",
    path: "/",
    expires: expiresAt
  });

  redirect(`/${orgSlug}/dashboard`);
}
