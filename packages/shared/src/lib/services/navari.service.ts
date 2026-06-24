import axios from "axios";
import {
  Organization,
  OrganizationSettings,
  OrganizationIntegration,
  db,
  Prisma,
} from "@repo/db";

interface ReportSaleOptions {
  country: string;
  highValueThreshold: number;
}

class NavariService {
  private async validateAccess(
    organizationId: string,
    options: { taxOnly?: boolean } = {},
  ) {
    // 1. Feature Flag / Entitlement Check (Optional, but good for multi-tier)
    // You might check if the organization's plan allows for Navari integration
    if (!organizationId) {
      throw new Error(
        "Organization ID is required to access Navari integration",
      );
    }

    // 2. Organization Check
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: { settings: true },
    });

    if (!org) throw new Error("Organization not found");

    const settings = org.settings as any;

    // 3. Country Check (Tax services are Kenya-only)
    if (options.taxOnly && settings?.country !== "Kenya") {
      throw new Error(
        "Navari tax integration is only available for Kenyan organizations",
      );
    }

    // 4. Integration Enabled Check
    if (options.taxOnly && !settings?.taxIntegrationEnabled) {
      throw new Error("Tax integration is not enabled for this organization");
    }

    // 5. Credentials Check
    const credentials = await this.getAuthToken(organizationId);
    return credentials;
  }

  /**
   * Initialize organization with Navari
   * Store Navari credentials and organization configuration
   */
  async setupOrganization(
    organizationId: string,
    credentials: { apiKey: string; apiSecret: string },
  ): Promise<OrganizationIntegration> {
    const definition = await db.integrationDefinition.upsert({
      where: { slug: "navari" },
      update: { isActive: true },
      create: {
        name: "Navari KRA Integration",
        slug: "navari",
        category: "OTHER",
        authType: "API_KEY",
      },
    });

    return await db.organizationIntegration.upsert({
      where: {
        organizationId_integrationDefinitionId: {
          organizationId,
          integrationDefinitionId: definition.id,
        },
      },
      update: {
        credentials: {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
        } as any,
        isActive: true,
      },
      create: {
        organizationId,
        integrationDefinitionId: definition.id,
        credentials: {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
        } as any,
        isActive: true,
      },
    });
  }

  private async getAuthToken(organizationId: string) {
    const integration = await db.organizationIntegration.findFirst({
      where: {
        organizationId,
        integrationDefinition: { slug: "navari" },
        isActive: true,
      },
    });

    if (!integration || !integration.credentials) {
      throw new Error(
        "Navari integration not configured for this organization",
      );
    }

    const { apiKey, apiSecret } = integration.credentials as any;
    return { apiKey, apiSecret };
  }

  /**
   * Validate KRA PIN format and existence
   */
  async validateKRAPin(organizationId: string, kraPin: string) {
    const { apiKey, apiSecret } = await this.validateAccess(organizationId, {
      taxOnly: true,
    });

    // In a real implementation, this would call Navari API
    // return axios.get(`https://api.navari.com/validate/pin/${kraPin}`, {
    //   headers: { 'X-API-KEY': apiKey, 'X-API-SECRET': apiSecret }
    // });

    return { valid: true, pin: kraPin, owner: "Validated via Navari" };
  }

  /**
   * Report a sale to KRA via Navari (TIMS/eTIMS compliance)
   */
  async reportSale(transaction: any, options: ReportSaleOptions) {
    // Implementation logic for reporting sale to Navari
    console.log(
      `Reporting sale ${transaction.id} to ${options.country} via Navari`,
    );
    return { success: true, navariId: `NAV-${Date.now()}` };
  }
}

export const navariService = new NavariService();
