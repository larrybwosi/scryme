import { prisma as db } from "@repo/db";
import axios from "axios";

export interface NavariConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

export interface NavariInvoiceInput {
  invoiceId: string;
  kraPin: string;
  netTotal: number;
  totalTaxes: number;
  items: Array<{
    itemCode: string;
    quantity: number;
    rate: number;
  }>;
}

class NavariService {
  private async getConfig(organizationId: string): Promise<NavariConfig | null> {
    const integration = await db.organizationIntegration.findFirst({
      where: {
        organizationId,
        integrationDefinition: { slug: "navari" },
        isActive: true,
      },
    });

    if (!integration || !integration.credentials) return null;

    const credentials = integration.credentials as any;
    const settings = (integration.settings as any) || {};

    return {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      baseUrl: settings.baseUrl || "https://api.navari.io/v1",
    };
  }

  /**
   * Generates an ETR invoice with Navari (KRA compliance)
   */
  async generateETRInvoice(
    organizationId: string,
    input: NavariInvoiceInput,
  ): Promise<any> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      console.warn(`Navari integration not configured for org ${organizationId}`);
      return null;
    }

    try {
      const response = await axios.post(
        `${config.baseUrl}/invoices`,
        {
          external_id: input.invoiceId,
          customer_pin: input.kraPin,
          amount_net: input.netTotal,
          amount_tax: input.totalTaxes,
          items: input.items.map((item) => ({
            code: item.itemCode,
            quantity: item.quantity,
            unit_price: item.rate,
          })),
        },
        {
          headers: {
            "X-API-KEY": config.apiKey,
            "X-API-SECRET": config.apiSecret,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("Navari API Error:", error.response?.data || error.message);
      throw new Error("Failed to generate ETR invoice via Navari");
    }
  }

  /**
   * Initialize organization with Navari
   * Store Navari credentials and organization configuration
   */
  async setupOrganization(
    organizationId: string,
    credentials: { apiKey: string; apiSecret: string },
  ): Promise<any> {
    const definition = await db.integrationDefinition.upsert({
      where: { slug: "navari" },
      update: { isActive: true },
      create: {
        name: "Navari KRA Integration",
        slug: "navari",
        category: "OTHER",
        authType: "API_KEY",
        isActive: true,
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
        credentials: credentials as any,
        isActive: true,
      },
      create: {
        organizationId,
        integrationDefinitionId: definition.id,
        credentials: credentials as any,
        isActive: true,
      },
    });
  }
}

export const navariService = new NavariService();
