import axios, { AxiosInstance } from "axios";
import { db } from "@repo/db";

function getNavariBaseUrl() {
  return process.env.NAVARI_API_URL || "https://api.navari.co.ke/v1";
}

export class NavariService {
  private _client: AxiosInstance | null = null;

  private get client(): AxiosInstance {
    if (!this._client) {
      this._client = axios.create({
        baseURL: getNavariBaseUrl(),
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return this._client;
  }

  private async isGloballyDisabled(): Promise<boolean> {
    try {
      const setting = await db.globalSetting.findUnique({
        where: { key: "navari_emergency_disable" },
      });
      return setting?.value === "true";
    } catch (error) {
      return false;
    }
  }

  private async validateAccess(
    organizationId: string,
    options: { taxOnly?: boolean } = {},
  ) {
    if (await this.isGloballyDisabled()) {
      throw new Error(
        "Navari service is temporarily disabled by system administrator",
      );
    }

    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: { settings: true },
    });

    if (!org) throw new Error("Organization not found");

    const settings = org.settings;

    if (options.taxOnly && settings?.country !== "Kenya") {
      throw new Error(
        "Navari tax integration is only available for Kenyan organizations",
      );
    }

    if (options.taxOnly && !settings?.taxIntegrationEnabled) {
      throw new Error("Tax integration is not enabled for this organization");
    }

    const credentials = await this.getAuthToken(organizationId);
    return credentials;
  }

  async setupOrganization(
    organizationId: string,
    credentials: { apiKey: string; apiSecret: string },
  ) {
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

  async validateKRAPin(organizationId: string, kraPin: string) {
    const { apiKey, apiSecret } = await this.validateAccess(organizationId, {
      taxOnly: true,
    });

    try {
      const response = await this.client.post(
        "/kra/validate-pin",
        {
          kraPin,
        },
        {
          headers: {
            "X-API-KEY": apiKey,
            "X-API-SECRET": apiSecret,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("[Navari Service] PIN Validation failed:", error.message);
      const isValidFormat = /^[A-Z]\d{9}[A-Z]$/.test(kraPin.toUpperCase());
      return {
        valid: isValidFormat,
        message: isValidFormat
          ? "KRA PIN format is valid"
          : "Invalid KRA PIN format",
      };
    }
  }

  async generateETRInvoice(organizationId: string, invoiceData: any) {
    const { apiKey, apiSecret } = await this.validateAccess(organizationId, {
      taxOnly: true,
    });

    try {
      const response = await this.client.post("/kra/etr/invoice", invoiceData, {
        headers: {
          "X-API-KEY": apiKey,
          "X-API-SECRET": apiSecret,
        },
      });

      await db.kRAComplianceLog.create({
        data: {
          organizationId,
          invoiceId: invoiceData.invoiceId || "N/A",
          kraPin: invoiceData.kraPin,
          taxType: "VAT",
          taxRate: 16.0,
          taxableAmount: invoiceData.netTotal,
          taxAmount: invoiceData.totalTaxes,
          etrMode: true,
          status: "SUBMITTED",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("[Navari Service] ETR submission failed:", error.message);
      const isDown = !error.response || error.response.status >= 500;
      const navariError = new Error(
        `Failed to generate ETR invoice: ${error.message}`,
      );
      (navariError as any).isServiceDown = isDown;
      (navariError as any).statusCode = error.response?.status;
      throw navariError;
    }
  }

  async submitPurchaseToKRA(organizationId: string, purchaseData: any) {
    const { apiKey, apiSecret } = await this.validateAccess(organizationId, {
      taxOnly: true,
    });

    try {
      const response = await this.client.post(
        "/kra/purchase/submit",
        purchaseData,
        {
          headers: {
            "X-API-KEY": apiKey,
            "X-API-SECRET": apiSecret,
          },
        },
      );

      await db.kRAComplianceLog.create({
        data: {
          organizationId,
          invoiceId: purchaseData.purchaseId || "N/A",
          kraPin: purchaseData.supplierPin,
          taxType: "VAT",
          taxRate: 16.0,
          taxableAmount: purchaseData.subTotal,
          taxAmount: purchaseData.taxTotal,
          etrMode: false,
          status: "SUBMITTED",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "[Navari Service] Purchase submission failed:",
        error.message,
      );
      throw new Error(`Failed to submit purchase to KRA: ${error.message}`);
    }
  }

  async getVATReturn(
    organizationId: string,
    params: { startDate: string; endDate: string },
  ) {
    const { apiKey, apiSecret } = await this.validateAccess(organizationId, {
      taxOnly: true,
    });

    try {
      const response = await this.client.get("/kra/reports/vat-return", {
        params,
        headers: {
          "X-API-KEY": apiKey,
          "X-API-SECRET": apiSecret,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "[Navari Service] VAT return report failed:",
        error.message,
      );
      throw error;
    }
  }

  async fileVATReturn(organizationId: string, returnData: any) {
    const { apiKey, apiSecret } = await this.validateAccess(organizationId, {
      taxOnly: true,
    });

    try {
      const response = await this.client.post(
        "/kra/filing/vat-return",
        returnData,
        {
          headers: {
            "X-API-KEY": apiKey,
            "X-API-SECRET": apiSecret,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("[Navari Service] VAT filing failed:", error.message);
      throw error;
    }
  }

  async verifyMpesaTransaction(organizationId: string, transactionId: string) {
    if (await this.isGloballyDisabled()) {
      throw new Error(
        "Navari service is temporarily disabled by system administrator",
      );
    }
    const { apiKey, apiSecret } = await this.getAuthToken(organizationId);

    try {
      const response = await this.client.get(
        `/mpesa/transaction/${transactionId}`,
        {
          headers: {
            "X-API-KEY": apiKey,
            "X-API-SECRET": apiSecret,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "[Navari Service] Transaction verification failed:",
        error.message,
      );
      throw error;
    }
  }
}

export const navariService = new NavariService();
