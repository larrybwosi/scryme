import { AdminService } from "../admin.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { MembershipStatus, IntegrationCategory, AuthType } from "@repo/db";

describe("AdminService", () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      organization: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      organizationSettings: {
        create: vi.fn(),
      },
      member: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      oAuthClient: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      actionAuditLog: {
        findMany: vi.fn(),
      },
      deviceRegistry: {
        count: vi.fn(),
      },
      globalSetting: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      subscription: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      mpesaPaymentRequest: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      integrationDefinition: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      organizationIntegration: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
    },
  };

  beforeEach(() => {
    prisma = mockPrisma as any;
    service = new AdminService(prisma);
    vi.clearAllMocks();
  });

  describe("listOrganizations", () => {
    it("should list all organizations ordered by createdAt desc", async () => {
      mockPrisma.client.organization.findMany.mockResolvedValue([
        { id: "org-1", name: "Org 1" },
      ]);

      const result = await service.listOrganizations();
      expect(result).toEqual([{ id: "org-1", name: "Org 1" }]);
      expect(mockPrisma.client.organization.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              members: true,
              products: true,
            },
          },
        },
      });
    });
  });

  describe("getOrganizationDetails", () => {
    it("should return organization if found", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({
        id: "org-1",
        name: "Org 1",
      });

      const result = await service.getOrganizationDetails("org-1");
      expect(result).toEqual({ id: "org-1", name: "Org 1" });
      expect(mockPrisma.client.organization.findUnique).toHaveBeenCalledWith({
        where: { id: "org-1" },
        include: {
          settings: true,
          _count: {
            select: {
              members: true,
              products: true,
              transactions: true,
            },
          },
        },
      });
    });

    it("should throw NotFoundException if organization not found", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue(null);

      await expect(service.getOrganizationDetails("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createOrganization", () => {
    it("should create organization and default settings", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue(null);
      mockPrisma.client.organization.create.mockResolvedValue({
        id: "new-org",
        name: "New Org",
        slug: "new-org",
      });

      const result = await service.createOrganization({
        name: "New Org",
        slug: "new-org",
      });

      expect(result).toEqual({ id: "new-org", name: "New Org", slug: "new-org" });
      expect(mockPrisma.client.organization.create).toHaveBeenCalledWith({
        data: {
          name: "New Org",
          slug: "new-org",
          logo: undefined,
          description: undefined,
        },
      });
      expect(mockPrisma.client.organizationSettings.create).toHaveBeenCalledWith({
        data: {
          organizationId: "new-org",
          defaultCurrency: "USD",
          defaultTimezone: "UTC",
        },
      });
    });

    it("should throw BadRequestException if slug is already taken", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        service.createOrganization({ name: "New", slug: "existing-slug" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateOrganization", () => {
    it("should update organization if found and slug unique", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.organization.findFirst.mockResolvedValue(null);
      mockPrisma.client.organization.update.mockResolvedValue({
        id: "org-1",
        name: "Updated Name",
      });

      const result = await service.updateOrganization("org-1", {
        name: "Updated Name",
        slug: "new-unique-slug",
      });

      expect(result).toEqual({ id: "org-1", name: "Updated Name" });
      expect(mockPrisma.client.organization.update).toHaveBeenCalledWith({
        where: { id: "org-1" },
        data: {
          name: "Updated Name",
          slug: "new-unique-slug",
          logo: undefined,
          description: undefined,
        },
      });
    });

    it("should throw BadRequestException if update slug is already taken by another org", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.organization.findFirst.mockResolvedValue({ id: "another-org" });

      await expect(
        service.updateOrganization("org-1", { slug: "taken-slug" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteOrganization", () => {
    it("should update deletedAt timestamp for soft-delete", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.organization.update.mockResolvedValue({
        id: "org-1",
        deletedAt: new Date(),
      });

      const result = await service.deleteOrganization("org-1");
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe("listMembers", () => {
    it("should list members with filters if supplied", async () => {
      mockPrisma.client.member.findMany.mockResolvedValue([
        { id: "member-1", isActive: true },
      ]);

      const result = await service.listMembers({ isActive: true });
      expect(result).toEqual([{ id: "member-1", isActive: true }]);
      expect(mockPrisma.client.member.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              isActive: true,
          },
        },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });
  });

  describe("banUser", () => {
    it("should ban user globally and suspend associated members", async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({ id: "user-1" });
      mockPrisma.client.user.update.mockResolvedValue({ id: "user-1", banned: true });

      const result = await service.banUser("user-1", {
        banReason: "Cheating",
      });

      expect(result.banned).toBe(true);
      expect(mockPrisma.client.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          banned: true,
          banReason: "Cheating",
          banExpires: null,
          isActive: false,
        },
      });

      expect(mockPrisma.client.member.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        data: {
          isActive: false,
          membershipStatus: MembershipStatus.SUSPENDED,
          banReason: "Cheating",
        },
      });
    });
  });

  describe("unbanUser", () => {
    it("should unban user globally and re-enable associated members", async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({ id: "user-1" });
      mockPrisma.client.user.update.mockResolvedValue({ id: "user-1", banned: false });

      const result = await service.unbanUser("user-1");

      expect(result.banned).toBe(false);
      expect(mockPrisma.client.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          banned: false,
          banReason: null,
          banExpires: null,
          isActive: true,
        },
      });

      expect(mockPrisma.client.member.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        data: {
          isActive: true,
          membershipStatus: MembershipStatus.ACTIVE,
          banReason: null,
        },
      });
    });
  });

  describe("getStats", () => {
    it("should return correct overview counts", async () => {
      mockPrisma.client.user.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8); // active
      mockPrisma.client.organization.count.mockResolvedValue(3);
      mockPrisma.client.member.count.mockResolvedValue(15);
      mockPrisma.client.deviceRegistry.count.mockResolvedValue(5);
      mockPrisma.client.oAuthClient.count.mockResolvedValue(2);

      const result = await service.getStats();

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        totalOrganizations: 3,
        totalMembers: 15,
        activeDevices: 5,
        totalConnectedApps: 2,
      });
    });
  });

  // --- Global Settings Tests ---

  describe("globalSettings", () => {
    it("should list global settings", async () => {
      mockPrisma.client.globalSetting.findMany.mockResolvedValue([
        { key: "system:mode", value: "live" },
      ]);

      const result = await service.listGlobalSettings();
      expect(result).toEqual([{ key: "system:mode", value: "live" }]);
      expect(mockPrisma.client.globalSetting.findMany).toHaveBeenCalledWith({
        orderBy: { key: "asc" },
      });
    });

    it("should set global setting via upsert", async () => {
      mockPrisma.client.globalSetting.upsert.mockResolvedValue({
        key: "system:mode",
        value: "test",
      });

      const result = await service.setGlobalSetting({
        key: "system:mode",
        value: "test",
      });

      expect(result).toEqual({ key: "system:mode", value: "test" });
      expect(mockPrisma.client.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "system:mode" },
        update: { value: "test" },
        create: { key: "system:mode", value: "test" },
      });
    });

    it("should delete global setting if exists", async () => {
      mockPrisma.client.globalSetting.findUnique.mockResolvedValue({
        key: "system:mode",
        value: "live",
      });
      mockPrisma.client.globalSetting.delete.mockResolvedValue({
        key: "system:mode",
      });

      const result = await service.deleteGlobalSetting("system:mode");
      expect(result).toBeDefined();
      expect(mockPrisma.client.globalSetting.delete).toHaveBeenCalledWith({
        where: { key: "system:mode" },
      });
    });

    it("should throw NotFoundException on delete non-existent setting", async () => {
      mockPrisma.client.globalSetting.findUnique.mockResolvedValue(null);

      await expect(service.deleteGlobalSetting("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Global Tiers Tests ---

  describe("globalTiers", () => {
    it("should list tiers as parsed JSON or default empty array", async () => {
      mockPrisma.client.globalSetting.findUnique.mockResolvedValue({
        key: "system:tiers",
        value: JSON.stringify([{ slug: "growth", name: "Growth Plan", price: 49 }]),
      });

      const result = await service.listTiers();
      expect(result).toEqual([{ slug: "growth", name: "Growth Plan", price: 49 }]);
    });

    it("should define tier and upsert system:tiers value", async () => {
      mockPrisma.client.globalSetting.findUnique.mockResolvedValue(null);
      mockPrisma.client.globalSetting.upsert.mockResolvedValue({
        key: "system:tiers",
        value: "some-string",
      });

      const result = await service.defineTier({
        slug: "growth",
        name: "Growth Plan",
        price: 49,
        description: "Great plan",
        limits: { members: 10 },
        features: ["b2b"],
      });

      expect(result).toEqual({
        slug: "growth",
        name: "Growth Plan",
        price: 49,
        description: "Great plan",
        limits: { members: 10 },
        features: ["b2b"],
      });

      expect(mockPrisma.client.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "system:tiers" },
        update: {
          value: JSON.stringify([
            {
              slug: "growth",
              name: "Growth Plan",
              price: 49,
              description: "Great plan",
              limits: { members: 10 },
              features: ["b2b"],
            },
          ]),
        },
        create: {
          key: "system:tiers",
          value: JSON.stringify([
            {
              slug: "growth",
              name: "Growth Plan",
              price: 49,
              description: "Great plan",
              limits: { members: 10 },
              features: ["b2b"],
            },
          ]),
        },
      });
    });

    it("should delete tier if exists", async () => {
      mockPrisma.client.globalSetting.findUnique.mockResolvedValue({
        key: "system:tiers",
        value: JSON.stringify([{ slug: "growth", name: "Growth" }]),
      });
      mockPrisma.client.globalSetting.update.mockResolvedValue({});

      const result = await service.deleteTier("growth");
      expect(result.success).toBe(true);
      expect(mockPrisma.client.globalSetting.update).toHaveBeenCalledWith({
        where: { key: "system:tiers" },
        data: { value: JSON.stringify([]) },
      });
    });

    it("should throw NotFoundException on delete non-existent tier", async () => {
      mockPrisma.client.globalSetting.findUnique.mockResolvedValue(null);

      await expect(service.deleteTier("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- Organization Subscriptions Tests ---

  describe("organizationSubscriptions", () => {
    it("should return default free tier when subscription does not exist", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.subscription.findUnique.mockResolvedValue(null);

      const result = await service.getOrganizationSubscription("org-1");
      expect(result).toEqual({
        organizationId: "org-1",
        tierSlug: "free",
        dodoCustomerId: null,
        dodoSubscriptionId: null,
        dodoPriceId: null,
        dodoCurrentPeriodEnd: null,
      });
    });

    it("should return subscription details when exists", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.subscription.findUnique.mockResolvedValue({
        id: "sub-1",
        organizationId: "org-1",
        dodoPriceId: "growth",
        dodoCustomerId: "cust-1",
        dodoSubscriptionId: "sub-dodo-1",
        dodoCurrentPeriodEnd: new Date("2026-12-31"),
      });

      const result = await service.getOrganizationSubscription("org-1");
      expect(result).toEqual({
        id: "sub-1",
        organizationId: "org-1",
        tierSlug: "growth",
        dodoCustomerId: "cust-1",
        dodoSubscriptionId: "sub-dodo-1",
        dodoPriceId: "growth",
        dodoCurrentPeriodEnd: new Date("2026-12-31"),
      });
    });

    it("should update/upsert organization subscription", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.subscription.upsert.mockResolvedValue({ id: "sub-1" });

      const result = await service.updateOrganizationSubscription("org-1", {
        tierSlug: "premium",
        dodoCustomerId: "cust-1",
        dodoSubscriptionId: "sub-123",
        dodoCurrentPeriodEnd: "2026-12-31T00:00:00.000Z",
      });

      expect(result).toBeDefined();
      expect(mockPrisma.client.subscription.upsert).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        update: {
          dodoPriceId: "premium",
          dodoCustomerId: "cust-1",
          dodoSubscriptionId: "sub-123",
          dodoCurrentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
        },
        create: {
          organizationId: "org-1",
          dodoPriceId: "premium",
          dodoCustomerId: "cust-1",
          dodoSubscriptionId: "sub-123",
          dodoCurrentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
        },
      });
    });
  });

  // --- Payments Tracking Tests ---

  describe("paymentsTracking", () => {
    it("should list system payments", async () => {
      mockPrisma.client.mpesaPaymentRequest.findMany.mockResolvedValue([
        { id: "pay-1", amount: 100 },
      ]);

      const result = await service.listSystemPayments();
      expect(result).toEqual([{ id: "pay-1", amount: 100 }]);
      expect(mockPrisma.client.mpesaPaymentRequest.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    it("should record custom payment and update subscription tier", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "mem-1" });
      mockPrisma.client.mpesaPaymentRequest.create.mockResolvedValue({
        id: "pay-123",
        amount: 49,
      });
      mockPrisma.client.subscription.upsert.mockResolvedValue({ id: "sub-1" });

      const result = await service.recordCustomPayment({
        organizationId: "org-1",
        amount: 49,
        phoneNumber: "254712345678",
        reference: "MPESAREF123",
        tierSlug: "growth",
        notes: "M-Pesa payment",
      });

      expect(result).toEqual({ id: "pay-123", amount: 49 });
      expect(mockPrisma.client.mpesaPaymentRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          memberId: "mem-1",
          amount: 49,
          phoneNumber: "254712345678",
          reference: "MPESAREF123",
          status: "SUCCESS",
        }),
      });
      expect(mockPrisma.client.subscription.upsert).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        update: expect.objectContaining({
          dodoPriceId: "growth",
          dodoSubscriptionId: "custom-sub-MPESAREF123",
        }),
        create: expect.objectContaining({
          organizationId: "org-1",
          dodoPriceId: "growth",
          dodoSubscriptionId: "custom-sub-MPESAREF123",
        }),
      });
    });

    it("should throw BadRequestException if organization has no member to associate payment", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(
        service.recordCustomPayment({
          organizationId: "org-1",
          amount: 49,
          phoneNumber: "254700000000",
          reference: "REF",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // --- Integration Definitions Tests ---

  describe("integrationDefinitions", () => {
    it("should list integration definitions", async () => {
      mockPrisma.client.integrationDefinition.findMany.mockResolvedValue([
        { id: "int-1", name: "Shopify" },
      ]);

      const result = await service.listIntegrationDefinitions();
      expect(result).toEqual([{ id: "int-1", name: "Shopify" }]);
      expect(mockPrisma.client.integrationDefinition.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
      });
    });

    it("should create integration definition", async () => {
      mockPrisma.client.integrationDefinition.findUnique.mockResolvedValue(null);
      mockPrisma.client.integrationDefinition.create.mockResolvedValue({
        id: "int-1",
        slug: "shopify",
      });

      const result = await service.createIntegrationDefinition({
        name: "Shopify",
        slug: "shopify",
        category: IntegrationCategory.E_COMMERCE,
        authType: AuthType.API_KEY,
      });

      expect(result).toEqual({ id: "int-1", slug: "shopify" });
    });

    it("should throw BadRequestException if slug taken when creating integration", async () => {
      mockPrisma.client.integrationDefinition.findUnique.mockResolvedValue({
        id: "existing",
      });

      await expect(
        service.createIntegrationDefinition({
          name: "Shopify",
          slug: "shopify",
          category: IntegrationCategory.E_COMMERCE,
          authType: AuthType.API_KEY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should update integration definition", async () => {
      mockPrisma.client.integrationDefinition.findUnique.mockResolvedValue({
        id: "int-1",
        slug: "shopify",
      });
      mockPrisma.client.integrationDefinition.update.mockResolvedValue({
        id: "int-1",
        name: "Shopify Updated",
      });

      const result = await service.updateIntegrationDefinition("int-1", {
        name: "Shopify Updated",
      });

      expect(result).toEqual({ id: "int-1", name: "Shopify Updated" });
    });

    it("should delete integration definition if exists", async () => {
      mockPrisma.client.integrationDefinition.findUnique.mockResolvedValue({
        id: "int-1",
      });
      mockPrisma.client.integrationDefinition.delete.mockResolvedValue({
        id: "int-1",
      });

      const result = await service.deleteIntegrationDefinition("int-1");
      expect(result).toBeDefined();
    });
  });

  // --- Active Integrations List Tests ---

  describe("activeOrganizationIntegrations", () => {
    it("should list active integrations system-wide", async () => {
      mockPrisma.client.organizationIntegration.findMany.mockResolvedValue([
        { id: "org-int-1", isActive: true },
      ]);

      const result = await service.listActiveOrganizationIntegrations();
      expect(result).toEqual([{ id: "org-int-1", isActive: true }]);
      expect(mockPrisma.client.organizationIntegration.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          integrationDefinition: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    });
  });
});
