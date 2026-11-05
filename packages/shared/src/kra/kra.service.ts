import { prisma as db } from "@repo/db";
import {
  IKRAProvider,
  KRAConfiguration,
  KRAInvoicePayload,
  KRAPurchasePayload,
  KRAPinValidationResult,
  KRASubmissionResult,
} from "./types";
import { NavariKRAProvider } from "./navari.provider";
import { DirectEtimsKRAProvider } from "./direct-etims.provider";

export class KRAService {
  private providers: Map<string, IKRAProvider> = new Map();

  constructor() {
    this.registerProvider(new NavariKRAProvider());
    this.registerProvider(new DirectEtimsKRAProvider());
  }

  registerProvider(provider: IKRAProvider) {
    this.providers.set(provider.providerType, provider);
  }

  getProvider(providerType: string): IKRAProvider {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Unsupported KRA provider: ${providerType}`);
    }
    return provider;
  }

  async getConfiguration(organizationId: string): Promise<KRAConfiguration | null> {
    const config = await db.kRAConfig.findUnique({
      where: { organizationId },
    });

    if (!config) {
      const org = await db.organization.findUnique({
        where: { id: organizationId },
        include: { settings: true },
      });

      if (!org?.settings?.taxIntegrationEnabled && !org?.settings?.defaultTaxId) {
        return null;
      }

      return {
        organizationId,
        provider: "NAVARI",
        environment: "SANDBOX",
        enforcementMode: "ASYNC",
        kraPin: org.settings?.defaultTaxId || "A000000000X",
        businessName: org.name,
        branchCode: "00",
        deviceSerialNumber: null,
        controlUnitId: null,
        apiKey: null,
        apiSecret: null,
        highValueThreshold: Number(org.settings?.highValueTaxThreshold || 100000),
        autoSyncSales: true,
        autoSyncPurchases: true,
        isActive: org.settings?.taxIntegrationEnabled ?? false,
      };
    }

    return {
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider as any,
      environment: config.environment as any,
      enforcementMode: config.enforcementMode as any,
      kraPin: config.kraPin,
      businessName: config.businessName,
      branchCode: config.branchCode,
      deviceSerialNumber: config.deviceSerialNumber,
      controlUnitId: config.controlUnitId,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      highValueThreshold: Number(config.highValueThreshold),
      autoSyncSales: config.autoSyncSales,
      autoSyncPurchases: config.autoSyncPurchases,
      isActive: config.isActive,
    };
  }

  async saveConfiguration(
    organizationId: string,
    data: Partial<KRAConfiguration> & { kraPin: string },
  ): Promise<KRAConfiguration> {
    const saved = await db.kRAConfig.upsert({
      where: { organizationId },
      update: {
        provider: data.provider || "NAVARI",
        environment: data.environment || "SANDBOX",
        enforcementMode: data.enforcementMode || "ASYNC",
        kraPin: data.kraPin.toUpperCase(),
        businessName: data.businessName,
        branchCode: data.branchCode || "00",
        deviceSerialNumber: data.deviceSerialNumber,
        controlUnitId: data.controlUnitId,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        highValueThreshold: data.highValueThreshold ?? 100000.0,
        autoSyncSales: data.autoSyncSales ?? true,
        autoSyncPurchases: data.autoSyncPurchases ?? true,
        isActive: data.isActive ?? true,
      },
      create: {
        organizationId,
        provider: data.provider || "NAVARI",
        environment: data.environment || "SANDBOX",
        enforcementMode: data.enforcementMode || "ASYNC",
        kraPin: data.kraPin.toUpperCase(),
        businessName: data.businessName,
        branchCode: data.branchCode || "00",
        deviceSerialNumber: data.deviceSerialNumber,
        controlUnitId: data.controlUnitId,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        highValueThreshold: data.highValueThreshold ?? 100000.0,
        autoSyncSales: data.autoSyncSales ?? true,
        autoSyncPurchases: data.autoSyncPurchases ?? true,
        isActive: data.isActive ?? true,
      },
    });

    await db.organizationSettings.upsert({
      where: { organizationId },
      update: {
        taxIntegrationEnabled: saved.isActive,
        defaultTaxId: saved.kraPin,
        highValueTaxThreshold: saved.highValueThreshold,
        country: "Kenya",
      },
      create: {
        organizationId,
        taxIntegrationEnabled: saved.isActive,
        defaultTaxId: saved.kraPin,
        highValueTaxThreshold: saved.highValueThreshold,
        country: "Kenya",
      },
    });

    return {
      id: saved.id,
      organizationId: saved.organizationId,
      provider: saved.provider as any,
      environment: saved.environment as any,
      enforcementMode: saved.enforcementMode as any,
      kraPin: saved.kraPin,
      businessName: saved.businessName,
      branchCode: saved.branchCode,
      deviceSerialNumber: saved.deviceSerialNumber,
      controlUnitId: saved.controlUnitId,
      apiKey: saved.apiKey,
      apiSecret: saved.apiSecret,
      highValueThreshold: Number(saved.highValueThreshold),
      autoSyncSales: saved.autoSyncSales,
      autoSyncPurchases: saved.autoSyncPurchases,
      isActive: saved.isActive,
    };
  }

  async validatePin(organizationId: string, kraPin: string): Promise<KRAPinValidationResult> {
    const config = await this.getConfiguration(organizationId);
    const effectiveConfig: KRAConfiguration = config || {
      organizationId,
      provider: "NAVARI",
      environment: "SANDBOX",
      enforcementMode: "ASYNC",
      kraPin: "A000000000X",
      branchCode: "00",
      highValueThreshold: 100000,
      autoSyncSales: true,
      autoSyncPurchases: true,
      isActive: true,
    };

    const provider = this.getProvider(effectiveConfig.provider);
    return provider.validatePin(effectiveConfig, kraPin);
  }

  async processInvoiceCompliance(
    organizationId: string,
    payload: KRAInvoicePayload,
  ): Promise<KRASubmissionResult> {
    const config = await this.getConfiguration(organizationId);
    if (!config || !config.isActive) {
      return {
        success: false,
        status: "FAILED",
        errorMessage: "KRA Tax Integration is not enabled for this organization",
      };
    }

    const provider = this.getProvider(config.provider);

    const log = await db.kRAComplianceLog.create({
      data: {
        organizationId,
        invoiceId: payload.invoiceId,
        transactionId: payload.transactionId,
        provider: config.provider,
        kraPin: payload.customerPin || config.kraPin,
        taxType: "VAT",
        taxRate: 16.0,
        taxableAmount: payload.netTotal,
        taxAmount: payload.totalTaxes,
        etrMode: payload.etrMode ?? true,
        status: "LOGGED",
      },
    });

    try {
      const result = await provider.submitInvoice(config, payload);

      await db.kRAComplianceLog.update({
        where: { id: log.id },
        data: {
          status: result.status,
          controlCode: result.controlCode,
          receiptNumber: result.receiptNumber,
          qrCodeUrl: result.qrCodeUrl,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          acknowledgedAt: result.success ? new Date() : null,
          metadata: result.rawResponse || {},
        },
      });

      if (result.success) {
        if (payload.invoiceId) {
          await db.invoice.updateMany({
            where: { id: payload.invoiceId, organizationId },
            data: {
              kraCompliant: true,
              kraControlCode: result.controlCode,
              kraReceiptNumber: result.receiptNumber,
              kraQrCode: result.qrCodeUrl,
            },
          });
        }

        if (payload.transactionId) {
          await db.transaction.updateMany({
            where: { id: payload.transactionId, organizationId },
            data: {
              kraControlCode: result.controlCode,
              kraReceiptNumber: result.receiptNumber,
              kraQrCode: result.qrCodeUrl,
            },
          });
        }
      }

      return result;
    } catch (err: any) {
      await db.kRAComplianceLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: err.message,
        },
      });

      throw err;
    }
  }

  async retrySubmission(organizationId: string, logId: string): Promise<KRASubmissionResult> {
    const log = await db.kRAComplianceLog.findFirst({
      where: { id: logId, organizationId },
    });

    if (!log) {
      throw new Error("Compliance log not found");
    }

    const config = await this.getConfiguration(organizationId);
    if (!config) {
      throw new Error("KRA configuration not found");
    }

    const provider = this.getProvider(config.provider);

    const payload: KRAInvoicePayload = {
      invoiceId: log.invoiceId,
      transactionId: log.transactionId || undefined,
      netTotal: Number(log.taxableAmount),
      totalTaxes: Number(log.taxAmount),
      grandTotal: Number(log.taxableAmount) + Number(log.taxAmount),
      customerPin: log.kraPin,
      etrMode: log.etrMode,
      items: [
        {
          itemName: `Fiscal Invoice ${log.invoiceId}`,
          quantity: 1,
          unitPrice: Number(log.taxableAmount),
          lineTotal: Number(log.taxableAmount),
        },
      ],
    };

    const result = await provider.submitInvoice(config, payload);

    await db.kRAComplianceLog.update({
      where: { id: log.id },
      data: {
        status: result.status,
        controlCode: result.controlCode || log.controlCode,
        receiptNumber: result.receiptNumber || log.receiptNumber,
        qrCodeUrl: result.qrCodeUrl || log.qrCodeUrl,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        retryCount: { increment: 1 },
        acknowledgedAt: result.success ? new Date() : log.acknowledgedAt,
      },
    });

    return result;
  }
}

export const kraService = new KRAService();
