import { QuotaService } from "../quota.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("QuotaService", () => {
  let service: QuotaService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        globalSetting: {
          findUnique: jest.fn(),
        },
        organization: {
          findUnique: jest.fn(),
        },
        subscription: {
          findUnique: jest.fn(),
        },
        member: {
          count: jest.fn(),
        },
        product: {
          count: jest.fn(),
        },
        inventoryLocation: {
          count: jest.fn(),
        },
        webhookSubscription: {
          count: jest.fn(),
        },
        workflowEngineDefinition: {
          count: jest.fn(),
        },
        transaction: {
          count: jest.fn(),
        },
      },
    } as any;

    service = new QuotaService(prisma);
  });

  describe("getEffectiveQuota", () => {
    it("should merge default allocations, tier limits, and org overrides correctly", async () => {
      (prisma.client.organization.findUnique as jest.Mock).mockResolvedValue({
        id: "org-1",
        quotaOverrides: { maxProducts: 250 },
      });
      (prisma.client.subscription.findUnique as jest.Mock).mockResolvedValue({
        organizationId: "org-1",
        dodoPriceId: "free",
      });
      (prisma.client.globalSetting.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getEffectiveQuota("org-1");
      expect(result.effectiveLimits.maxProducts).toBe(250);
      expect(result.effectiveLimits.maxUsers).toBe(3); // from free tier
    });
  });

  describe("checkQuota", () => {
    it("should allow usage when under limit", async () => {
      jest.spyOn(service, "getEffectiveQuota").mockResolvedValue({
        organizationId: "org-1",
        tierSlug: "free",
        baseLimits: { maxProducts: 100 },
        defaultAllocations: {},
        overrides: {},
        effectiveLimits: { maxProducts: 100 },
      });

      (prisma.client.product.count as jest.Mock).mockResolvedValue(10);

      const res = await service.checkQuota("org-1", "maxProducts");
      expect(res.allowed).toBe(true);
      expect(res.current).toBe(10);
      expect(res.limit).toBe(100);
    });

    it("should deny usage when at or above limit", async () => {
      jest.spyOn(service, "getEffectiveQuota").mockResolvedValue({
        organizationId: "org-1",
        tierSlug: "free",
        baseLimits: { maxProducts: 100 },
        defaultAllocations: {},
        overrides: {},
        effectiveLimits: { maxProducts: 100 },
      });

      (prisma.client.product.count as jest.Mock).mockResolvedValue(100);

      const res = await service.checkQuota("org-1", "maxProducts");
      expect(res.allowed).toBe(false);
      expect(res.current).toBe(100);
    });
  });
});
