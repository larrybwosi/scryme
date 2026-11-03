import { describe, it, expect } from "vitest";
import { KRAService } from "../kra.service";
import { NavariKRAProvider } from "../navari.provider";
import { DirectEtimsKRAProvider } from "../direct-etims.provider";

describe("KRAService & Providers", () => {
  it("should initialize with default providers", () => {
    const service = new KRAService();
    expect(service.getProvider("NAVARI")).toBeInstanceOf(NavariKRAProvider);
    expect(service.getProvider("DIRECT_ETIMS")).toBeInstanceOf(DirectEtimsKRAProvider);
  });

  it("should validate KRA PIN format locally if offline", async () => {
    const navari = new NavariKRAProvider();
    const config = {
      organizationId: "org-1",
      provider: "NAVARI" as const,
      environment: "SANDBOX" as const,
      enforcementMode: "ASYNC" as const,
      kraPin: "P051123456Z",
      branchCode: "00",
      highValueThreshold: 100000,
      autoSyncSales: true,
      autoSyncPurchases: true,
      isActive: true,
    };

    const validResult = await navari.validatePin(config, "P051123456Z");
    expect(validResult.valid).toBe(true);

    const invalidResult = await navari.validatePin(config, "INVALID123");
    expect(invalidResult.valid).toBe(false);
  });

  it("should submit invoice with Direct eTIMS simulator in sandbox mode", async () => {
    const directEtims = new DirectEtimsKRAProvider();
    const config = {
      organizationId: "org-1",
      provider: "DIRECT_ETIMS" as const,
      environment: "SANDBOX" as const,
      enforcementMode: "ASYNC" as const,
      kraPin: "P051123456Z",
      branchCode: "00",
      highValueThreshold: 100000,
      autoSyncSales: true,
      autoSyncPurchases: true,
      isActive: true,
    };

    const res = await directEtims.submitInvoice(config, {
      invoiceId: "inv-test-1",
      customerPin: "A001234567X",
      netTotal: 1000,
      totalTaxes: 160,
      grandTotal: 1160,
      items: [
        {
          itemName: "Product A",
          quantity: 2,
          unitPrice: 500,
          lineTotal: 1000,
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.controlCode).toBeDefined();
    expect(res.receiptNumber).toBeDefined();
  });
});
