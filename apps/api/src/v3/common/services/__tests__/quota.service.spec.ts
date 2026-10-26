import { QuotaService } from "../quota.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("QuotaService", () => {
  let service: QuotaService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        globalSetting: {
          findUnique: vi.fn(),
        },
        organization: {
          findUnique: vi.fn(),
        },
        subscription: {
          findUnique: vi.fn(),
        },
        member: {
          count: vi.fn(),
        },
        product: {
          count: vi.fn(),
        },
        inventoryLocation: {
          count: vi.fn(),
        },
        webhookSubscription: {
          count: vi.fn(),
        },
        workflowEngineDefinition: {
          count: vi.fn(),
        },
        transaction: {
          count: vi.fn(),
        },
      },
    } as any;

    service = new QuotaService(prisma);
  });

  describe("getEffectiveQuota", () => {
    it("should merge default allocations, tier limits, and org overrides correctly", async () => {
      (prisma.client.organization.findUnique as any).mockResolvedValue({
        id: "org-1",
        quotaOverrides: { maxProducts: 250 },
      });
      (prisma.client.subscription.findUnique as any).mockResolvedValue({
        organizationId: "org-1",
        dodoPriceId: "free",
      });
      (prisma.client.globalSetting.findUnique as any).mockResolvedValue(null);

      const result = await service.getEffectiveQuota("org-1");
      expect(result.effectiveLimits.maxProducts).toBe(250);
      expect(result.effectiveLimits.maxUsers).toBe(3); // from free tier
    });

    it("should set all effective limits to -1 (unlimited) when bypassPaymentCheck is true", async () => {
      (prisma.client.organization.findUnique as any).mockResolvedValue({
        id: "org-1",
        quotaOverrides: { bypassPaymentCheck: true, maxProducts: 50 },
      });
      (prisma.client.subscription.findUnique as any).mockResolvedValue({
        organizationId: "org-1",
        dodoPriceId: "free",
      });
      (prisma.client.globalSetting.findUnique as any).mockResolvedValue(null);

      const result = await service.getEffectiveQuota("org-1");
      expect(result.effectiveLimits.maxProducts).toBe(-1);
      expect(result.effectiveLimits.maxUsers).toBe(-1);
    });
  });

  describe("checkQuota", () => {
    it("should allow usage when under limit", async () => {
      vi.spyOn(service, "getEffectiveQuota").mockResolvedValue({
        organizationId: "org-1",
        tierSlug: "free",
        baseLimits: { maxProducts: 100 },
        defaultAllocations: {},
        overrides: {},
        effectiveLimits: { maxProducts: 100 },
      });

      (prisma.client.product.count as any).mockResolvedValue(10);

      const res = await service.checkQuota("org-1", "maxProducts");
      expect(res.allowed).toBe(true);
      expect(res.current).toBe(10);
      expect(res.limit).toBe(100);
    });

    it("should deny usage when at or above limit", async () => {
      vi.spyOn(service, "getEffectiveQuota").mockResolvedValue({
        organizationId: "org-1",
        tierSlug: "free",
        baseLimits: { maxProducts: 100 },
        defaultAllocations: {},
        overrides: {},
        effectiveLimits: { maxProducts: 100 },
      });

      (prisma.client.product.count as any).mockResolvedValue(100);

      const res = await service.checkQuota("org-1", "maxProducts");
      expect(res.allowed).toBe(false);
      expect(res.current).toBe(100);
    });
  });
});
