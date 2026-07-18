import * as jose from 'jose';
import { env } from "@repo/env";

export interface ZitadelJwtPayload extends jose.JWTPayload {
  sub: string;
  'urn:zitadel:iam:org:id'?: string;
  scope?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export async function verifyZitadelJwt(
  token: string,
  domain: string,
  audience: string,
): Promise<ZitadelJwtPayload> {
  const issuer = `https://${domain}`;
  const jwksUri = `https://${domain}/oauth/v2/keys`;

  const res = await fetch(jwksUri);
  const { keys } = await res.json();
  const keyStore = jose.createLocalJWKSet({ keys });

  const { payload } = await jose.jwtVerify(token, keyStore, { audience, issuer });
  return payload as ZitadelJwtPayload;
}

export interface ZitadelProvisionResult {
  zitadelOrgId: string;
  zitadelProjectId: string;
  zitadelAppId: string;
  clientId: string;
  clientSecret?: string;
}

export class ZitadelService {
  constructor() {}

  async getUser(zitadelUserId: string) {
    // This is a placeholder for actual Zitadel API call
    console.log(`Fetching user ${zitadelUserId} from Zitadel`);
    return { id: zitadelUserId };
  }

  /**
   * Programmatically provisions a Zitadel Organization, a Project, and an OIDC Web Application.
   * If credentials are not present in the environment, runs in mock fallback mode.
   */
  async provisionOrganization(
    orgName: string,
    orgSlug: string,
    redirectUris: string[],
    postLogoutRedirectUris: string[],
  ): Promise<ZitadelProvisionResult> {
    const adminToken = env.ZITADEL_ADMIN_TOKEN;
    let apiUrl = env.ZITADEL_API_URL;

    // Fallback to domain if url not set
    if (!apiUrl && env.ZITADEL_DOMAIN) {
      apiUrl = `https://${env.ZITADEL_DOMAIN}`;
    }

    if (!adminToken || !apiUrl) {
      console.warn(
        `[ZitadelService] ZITADEL_ADMIN_TOKEN or ZITADEL_API_URL is not set. Running in MOCK provisioning mode.`
      );
      const mockOrgId = `org_mock_${Math.random().toString(36).substring(2, 10)}`;
      const mockProjectId = `proj_mock_${Math.random().toString(36).substring(2, 10)}`;
      const mockAppId = `app_mock_${Math.random().toString(36).substring(2, 10)}`;
      const mockClientId = `client_mock_${Math.random().toString(36).substring(2, 14)}@${orgSlug}`;
      const mockClientSecret = `secret_mock_${Math.random().toString(36).substring(2, 18)}`;

      return {
        zitadelOrgId: mockOrgId,
        zitadelProjectId: mockProjectId,
        zitadelAppId: mockAppId,
        clientId: mockClientId,
        clientSecret: mockClientSecret,
      };
    }

    const sanitizedApiUrl = apiUrl.replace(/\/$/, "");

    try {
      console.log(`[ZitadelService] Programmatically provisioning Zitadel organization for: ${orgName}`);

      // 1. Add Organization
      const orgUrl = `${sanitizedApiUrl}/zitadel.org.v2.OrganizationService/AddOrganization`;
      const orgRes = await fetch(orgUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: orgName,
        }),
      });

      if (!orgRes.ok) {
        const errText = await orgRes.text();
        throw new Error(`Failed to create Zitadel Organization: ${orgRes.status} ${orgRes.statusText} - ${errText}`);
      }

      const orgData = (await orgRes.json()) as any;
      const organizationId = orgData.organizationId;
      if (!organizationId) {
        throw new Error(`Zitadel Organization response did not contain organizationId: ${JSON.stringify(orgData)}`);
      }
      console.log(`[ZitadelService] Created Zitadel organization: ${organizationId}`);

      // 2. Create Project
      const projUrl = `${sanitizedApiUrl}/zitadel.project.v2.ProjectService/CreateProject`;
      const projRes = await fetch(projUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
          "x-zitadel-orgid": organizationId,
        },
        body: JSON.stringify({
          organizationId: organizationId,
          name: `${orgName} Storefront Project`,
          projectRoleAssertion: true,
          projectRoleCheck: false,
          hasProjectCheck: false,
        }),
      });

      if (!projRes.ok) {
        const errText = await projRes.text();
        throw new Error(`Failed to create Zitadel Project: ${projRes.status} ${projRes.statusText} - ${errText}`);
      }

      const projData = (await projRes.json()) as any;
      const projectId = projData.projectId;
      if (!projectId) {
        throw new Error(`Zitadel Project response did not contain projectId: ${JSON.stringify(projData)}`);
      }
      console.log(`[ZitadelService] Created Zitadel project: ${projectId}`);

      // 3. Create Application
      const appUrl = `${sanitizedApiUrl}/zitadel.application.v2.ApplicationService/CreateApplication`;
      const appRes = await fetch(appUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
          "x-zitadel-orgid": organizationId,
        },
        body: JSON.stringify({
          projectId: projectId,
          name: `${orgName} Storefront Web App`,
          oidcConfiguration: {
            redirectUris: redirectUris,
            responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
            grantTypes: ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
            appType: "OIDC_APP_TYPE_WEB",
            authMethodType: "OIDC_AUTH_METHOD_TYPE_NONE",
            postLogoutRedirectUris: postLogoutRedirectUris,
            devMode: true,
          },
        }),
      });

      if (!appRes.ok) {
        const errText = await appRes.text();
        throw new Error(`Failed to create Zitadel OIDC Application: ${appRes.status} ${appRes.statusText} - ${errText}`);
      }

      const appData = (await appRes.json()) as any;
      const applicationId = appData.applicationId;
      const clientId = appData.oidcConfiguration?.clientId || appData.clientId;

      if (!applicationId || !clientId) {
        throw new Error(`Zitadel Application response did not contain expected IDs: ${JSON.stringify(appData)}`);
      }

      console.log(`[ZitadelService] Created Zitadel application: ${applicationId}, clientId: ${clientId}`);

      return {
        zitadelOrgId: organizationId,
        zitadelProjectId: projectId,
        zitadelAppId: applicationId,
        clientId: clientId,
        clientSecret: appData.oidcConfiguration?.clientSecret,
      };
    } catch (error: any) {
      console.error(`[ZitadelService] Real programmatic provisioning failed: ${error.message}.`);
      throw error;
    }
  }
}
