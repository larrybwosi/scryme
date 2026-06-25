import { db, ZitadelConfiguration } from "@repo/db";
import { BaseIntegrationService, IntegrationStatus, IntegrationConnectionResult } from "@repo/shared/integrations";
import { Metadata } from "nice-grpc-common";
import { OIDCAuthMethodType, OIDCGrantType, OIDCResponseType } from "@zitadel/node/dist/api/generated/zitadel/app.js";
import { PrivateLabelingSetting } from "@zitadel/node/dist/api/generated/zitadel/project.js";
import { getZitadelManagementClient, getZitadelEnvConfig, getZitadelUserClient } from "./client";

export class ZitadelService implements BaseIntegrationService<Partial<ZitadelConfiguration>> {
  async testConnection(config: Partial<ZitadelConfiguration>): Promise<IntegrationConnectionResult> {
    try {
      const { domain } = getZitadelEnvConfig();
      const res = await fetch(`https://${domain}/.well-known/openid-configuration`);

      if (!res.ok) {
        return {
          success: false,
          status: { isActive: false, health: 'DISCONNECTED', error: `HTTP ${res.status}` },
          message: 'Could not reach Zitadel discovery endpoint'
        };
      }

      return {
        success: true,
        status: { isActive: true, health: 'HEALTHY' },
        message: 'Connected to Zitadel'
      };
    } catch (error) {
      return {
        success: false,
        status: { isActive: false, health: 'DISCONNECTED', error: String(error) },
        message: String(error)
      };
    }
  }

// fallow-ignore-next-line
  async getStatus(organizationId: string): Promise<IntegrationStatus> {
    const config = await db.zitadelConfiguration.findUnique({
      where: { organizationId }
    });

    if (!config) {
      return { isActive: false, health: 'UNKNOWN' };
    }

    return {
      isActive: config.isActive,
      health: config.connectionStatus as any,
      lastSyncAt: config.lastSyncAt,
      error: config.connectionError
    };
  }

// fallow-ignore-next-line
  async disconnect(organizationId: string): Promise<void> {
    await db.zitadelConfiguration.update({
      where: { organizationId },
      data: {
        isActive: false,
        connectionStatus: 'DISCONNECTED'
      }
    });
  }

  async provisionOrganization(organizationId: string, name: string) {
    const client = await getZitadelManagementClient();

    // 1. Create Zitadel Organization
    const org = await client.addOrg({ name });
    if (!org.id) throw new Error("Failed to create Zitadel organization");
    const zitadelOrgId = org.id;

    // 2. Create Zitadel Project
    const project = await client.addProject({
      name: `${name} Storefront`,
      projectRoleAssertion: false,
      projectRoleCheck: false,
      hasProjectCheck: false,
      privateLabelingSetting: PrivateLabelingSetting.PRIVATE_LABELING_SETTING_UNSPECIFIED
    }, { metadata: Metadata({ 'x-zitadel-orgid': zitadelOrgId }) });
    if (!project.id) throw new Error("Failed to create Zitadel project");
    const zitadelProjectId = project.id;

    // 3. Create OIDC App
    const app = await client.addOIDCApp({
        projectId: zitadelProjectId,
        name: 'Storefront Client',
        redirectUris: [`https://${name.toLowerCase().replace(/\s+/g, '-')}.dealio.app/api/auth/callback`],
        responseTypes: [OIDCResponseType.OIDC_RESPONSE_TYPE_CODE],
        grantTypes: [OIDCGrantType.OIDC_GRANT_TYPE_AUTHORIZATION_CODE, OIDCGrantType.OIDC_GRANT_TYPE_REFRESH_TOKEN],
        authMethodType: OIDCAuthMethodType.OIDC_AUTH_METHOD_TYPE_BASIC,
        appType: 0,
        postLogoutRedirectUris: [],
        version: 0,
        devMode: false,
        accessTokenType: 0,
        accessTokenRoleAssertion: false,
        idTokenRoleAssertion: false,
        idTokenUserinfoAssertion: false,
        clockSkew: undefined,
        additionalOrigins: [],
        skipNativeAppSuccessPage: false,
        backChannelLogoutUri: "",
        loginVersion: undefined
    }, { metadata: Metadata({ 'x-zitadel-orgid': zitadelOrgId }) });

    const zitadelAppId = app.appId ?? null;

    await db.zitadelConfiguration.upsert({
      where: { organizationId },
      create: {
        organizationId,
        zitadelOrgId,
        zitadelProjectId,
        zitadelAppId,
        connectionStatus: 'CONNECTED'
      },
      update: {
        zitadelOrgId,
        zitadelProjectId,
        zitadelAppId,
        connectionStatus: 'CONNECTED'
      }
    });

    return { zitadelOrgId, zitadelProjectId, zitadelAppId };
  }

// fallow-ignore-next-line
  async addStorefrontApp(organizationId: string, storefrontName: string, redirectUris: string[]) {
    const config = await db.zitadelConfiguration.findUnique({
      where: { organizationId }
    });

    if (!config?.zitadelProjectId || !config?.zitadelOrgId) {
      throw new Error("Zitadel not provisioned for this organization");
    }

    const client = await getZitadelManagementClient();

    const app = await client.addOIDCApp({
      projectId: config.zitadelProjectId,
      name: storefrontName,
      redirectUris,
      responseTypes: [OIDCResponseType.OIDC_RESPONSE_TYPE_CODE],
      grantTypes: [OIDCGrantType.OIDC_GRANT_TYPE_AUTHORIZATION_CODE, OIDCGrantType.OIDC_GRANT_TYPE_REFRESH_TOKEN],
      authMethodType: OIDCAuthMethodType.OIDC_AUTH_METHOD_TYPE_BASIC,
      appType: 0,
      postLogoutRedirectUris: [],
      version: 0,
      devMode: false,
      accessTokenType: 0,
      accessTokenRoleAssertion: false,
      idTokenRoleAssertion: false,
      idTokenUserinfoAssertion: false,
      clockSkew: undefined,
      additionalOrigins: [],
      skipNativeAppSuccessPage: false,
      backChannelLogoutUri: "",
      loginVersion: undefined
    }, { metadata: Metadata({ 'x-zitadel-orgid': config.zitadelOrgId }) });

    return {
      appId: app.appId,
      clientId: app.clientId,
    };
  }

  async getUser(zitadelUserId: string) {
    const client = await getZitadelUserClient();
    const response = await client.getUserByID({ userId: zitadelUserId });
    return response.user;
  }
}
