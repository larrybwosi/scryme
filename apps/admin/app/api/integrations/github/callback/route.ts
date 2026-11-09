import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db";
import { getSystemIntegrationSettings } from "@/app/actions/integrations";

/**
 * Handles GitHub App installation redirection & OAuth authorization callbacks.
 *
 * Query params from GitHub:
 * - installation_id: string
 * - setup_action: "install" | "update" | "request"
 * - code: string (OAuth exchange code if app user authorization enabled)
 * - state: string
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const code = searchParams.get("code");

  const settings = await getSystemIntegrationSettings();
  const upsertPromises: Promise<any>[] = [];

  if (installationId) {
    upsertPromises.push(
      db.globalSetting.upsert({
        where: { key: "system:integration:github:installationId" },
        update: { value: installationId },
        create: {
          key: "system:integration:github:installationId",
          value: installationId,
        },
      }),
    );
    upsertPromises.push(
      db.globalSetting.upsert({
        where: { key: "system:integration:github:enabled" },
        update: { value: "true" },
        create: {
          key: "system:integration:github:enabled",
          value: "true",
        },
      }),
    );
  }

  // Handle OAuth code exchange if Client ID and Secret are configured
  if (code && settings.githubClientId && settings.githubClientSecret) {
    try {
      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Scryme-Admin-App",
          },
          body: JSON.stringify({
            client_id: settings.githubClientId,
            client_secret: settings.githubClientSecret,
            code,
          }),
        },
      );

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          upsertPromises.push(
            db.globalSetting.upsert({
              where: { key: "system:integration:github:token" },
              update: { value: tokenData.access_token },
              create: {
                key: "system:integration:github:token",
                value: tokenData.access_token,
              },
            }),
          );
          upsertPromises.push(
            db.globalSetting.upsert({
              where: { key: "github_token" },
              update: { value: tokenData.access_token },
              create: {
                key: "github_token",
                value: tokenData.access_token,
              },
            }),
          );
        }
      }
    } catch (err) {
      console.error("Failed to exchange GitHub OAuth code:", err);
    }
  }

  if (upsertPromises.length > 0) {
    await Promise.all(upsertPromises);
  }

  const redirectUrl = new URL("/integrations/github", request.url);
  if (installationId) {
    redirectUrl.searchParams.set("connected", "true");
    redirectUrl.searchParams.set("installation_id", installationId);
  }
  if (setupAction) {
    redirectUrl.searchParams.set("setup_action", setupAction);
  }

  return NextResponse.redirect(redirectUrl);
}
