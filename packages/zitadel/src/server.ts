import * as jose from "jose";
import { env } from "@repo/env";

export interface ZitadelJwtPayload extends jose.JWTPayload {
  sub: string;
  "urn:zitadel:iam:org:id"?: string;
  scope?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

export interface ZitadelProvisionResult {
  zitadelOrgId: string;
  zitadelProjectId: string;
  zitadelAppId: string;
  clientId: string;
  clientSecret?: string;
}

// Global JWKS cache instance
let JWKS_CACHE: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

export async function verifyZitadelJwt(
  token: string,
  domain: string,
  audience: string,
): Promise<ZitadelJwtPayload> {
  const issuer = `https://${domain}`;
  if (!JWKS_CACHE) {
    JWKS_CACHE = jose.createRemoteJWKSet(
      new URL(`https://${domain}/oauth/v2/keys`),
    );
  }

  const { payload } = await jose.jwtVerify(token, JWKS_CACHE, {
    audience,
    issuer,
  });
  return payload as ZitadelJwtPayload;
}

export class ZitadelService {
  private getApiUrl(): string {
    const url =
      env.ZITADEL_API_URL ||
      (env.ZITADEL_DOMAIN ? `https://${env.ZITADEL_DOMAIN}` : "");
    return url.replace(/\/$/, "");
  }

  async getUser(zitadelUserId: string) {
    const adminToken = env.ZITADEL_ADMIN_TOKEN;
    const apiUrl = this.getApiUrl();

    if (!adminToken || !apiUrl) return { id: zitadelUserId };

    const res = await fetch(`${apiUrl}/zitadel.user.v2.UserService/GetUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        "Connect-Protocol-Version": "1",
      },
      body: JSON.stringify({ userId: zitadelUserId }),
    });

    if (!res.ok)
      throw new Error(
        `Failed to fetch user: ${res.status} ${await res.text()}`,
      );
    return await res.json();
  }

  async provisionOrganization(
    orgName: string,
    orgSlug: string,
    redirectUris: string[],
    postLogoutRedirectUris: string[],
  ): Promise<ZitadelProvisionResult> {
    const adminToken = env.ZITADEL_ADMIN_TOKEN;
    const apiUrl = this.getApiUrl();

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "Connect-Protocol-Version": "1",
    };

    // 1. Add Organization
    const orgRes = await fetch(
      `${apiUrl}/zitadel.org.v2.OrganizationService/AddOrganization`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ name: orgName }),
      },
    );
    if (!orgRes.ok)
      throw new Error(`Create Org failed: ${await orgRes.text()}`);
    const { organizationId } = await orgRes.json();

    // 2. Create Project
    const projRes = await fetch(
      `${apiUrl}/zitadel.project.v2.ProjectService/CreateProject`,
      {
        method: "POST",
        headers: { ...headers, "x-zitadel-orgid": organizationId },
        body: JSON.stringify({
          organizationId,
          name: `${orgName} Storefront Project`,
          projectRoleAssertion: true,
          authorizationRequired: false,
          projectAccessRequired: false,
        }),
      },
    );
    if (!projRes.ok)
      throw new Error(`Create Project failed: ${await projRes.text()}`);
    const { projectId } = await projRes.json();

    // 3. Create Application
    const appRes = await fetch(
      `${apiUrl}/zitadel.application.v2.ApplicationService/CreateApplication`,
      {
        method: "POST",
        headers: { ...headers, "x-zitadel-orgid": organizationId },
        body: JSON.stringify({
          projectId,
          name: `${orgName} Storefront Web App`,
          oidcConfiguration: {
            redirectUris,
            postLogoutRedirectUris,
            responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
            grantTypes: ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
            appType: "OIDC_APP_TYPE_WEB",
            authMethodType: "OIDC_AUTH_METHOD_TYPE_BASIC",
            devMode: true,
          },
        }),
      },
    );
    if (!appRes.ok)
      throw new Error(`Create App failed: ${await appRes.text()}`);
    const appData = await appRes.json();

    return {
      zitadelOrgId: organizationId,
      zitadelProjectId: projectId,
      zitadelAppId: appData.applicationId,
      clientId: appData.oidcConfiguration?.clientId,
      clientSecret: appData.oidcConfiguration?.clientSecret,
    };
  }
}
