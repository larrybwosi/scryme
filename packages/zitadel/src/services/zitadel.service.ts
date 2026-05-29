import { db, ZitadelConfiguration } from "@repo/db";
import { BaseIntegrationService, IntegrationStatus, IntegrationConnectionResult } from "@repo/shared";
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
    if (!org.details?.id) throw new Error("Failed to create Zitadel organization");
    const zitadelOrgId = org.details.id;

    // 2. Create Zitadel Project
    const project = await client.addProject({ name: `${name} Storefront` }, { headers: { 'x-zitadel-orgid': zitadelOrgId } });
    if (!project.details?.id) throw new Error("Failed to create Zitadel project");
    const zitadelProjectId = project.details.id;

    // 3. Create OIDC App
    const app = await client.addOIDCApp({
        projectId: zitadelProjectId,
        name: 'Storefront Client',
        redirectUris: [`https://${name.toLowerCase().replace(/\s+/g, '-')}.dealio.app/api/auth/callback`],
        responseTypes: [0], // CODE
        grantTypes: [0, 2], // AUTHORIZATION_CODE, REFRESH_TOKEN
        authMethodType: 0, // BASIC
    }, { headers: { 'x-zitadel-orgid': zitadelOrgId } });

    const zitadelAppId = app.details?.id ?? null;

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
      responseTypes: [0], // CODE
      grantTypes: [0, 2], // AUTHORIZATION_CODE, REFRESH_TOKEN
      authMethodType: 0, // BASIC
    }, { headers: { 'x-zitadel-orgid': config.zitadelOrgId } });

    return {
      appId: app.details?.id,
      clientId: (app as any).clientId, // Some SDK versions might put it in details, others on the object
    };
  }

  async getUser(zitadelUserId: string) {
    const client = await getZitadelUserClient();
    const response = await client.getUserByID({ userId: zitadelUserId });
    return response.user;
  }
}
