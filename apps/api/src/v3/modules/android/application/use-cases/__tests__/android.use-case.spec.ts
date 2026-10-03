import { describe, it, expect, beforeEach, vi } from "vitest";
import { AndroidUseCase } from "../android.use-case";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("AndroidUseCase", () => {
  let useCase: AndroidUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        organization: {
          findUnique: vi.fn(),
        },
        member: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        inventoryLocation: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        user: {
          update: vi.fn(),
        },
        deviceRegistry: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        transaction: {
          aggregate: vi.fn(),
        },
        productVariantStock: {
          count: vi.fn(),
        },
        customer: {
          count: vi.fn(),
        },
      },
    };

    useCase = new AndroidUseCase(mockPrisma as any);
  });

  describe("getMe", () => {
    it("should return profile, active organization, memberships and locations", async () => {
      const v3Context = { organizationId: "org-1", memberId: "mem-1" };
      const user = { id: "usr-1", email: "test@scryme.com", name: "Test Staff" };

      mockPrisma.client.organization.findUnique.mockResolvedValue({
        id: "org-1",
        name: "Test Org",
        slug: "test-org",
        logo: null,
      });

      mockPrisma.client.member.findUnique.mockResolvedValue({
        id: "mem-1",
        role: "ADMIN",
        user: { id: "usr-1", email: "test@scryme.com", name: "Test Staff", image: null },
      });

      mockPrisma.client.member.findMany.mockResolvedValue([
        {
          role: "ADMIN",
          organization: { id: "org-1", name: "Test Org", slug: "test-org" },
        },
      ]);

      mockPrisma.client.inventoryLocation.findMany.mockResolvedValue([
        { id: "loc-1", name: "Main Location", code: "MAIN", isDefault: true },
      ]);

      const result = await useCase.getMe(v3Context, user);

      expect(result.user.email).toBe("test@scryme.com");
      expect(result.activeOrganization.id).toBe("org-1");
      expect(result.memberships).toHaveLength(1);
      expect(result.locations).toHaveLength(1);
    });

    it("should throw NotFoundException if organization is not found", async () => {
      mockPrisma.client.organization.findUnique.mockResolvedValue(null);

      await expect(
        useCase.getMe({ organizationId: "invalid-org", memberId: null }, null),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("switchOrganization", () => {
    it("should update activeOrganizationId if user is an active member", async () => {
      const v3Context = { organizationId: "org-1" };
      const user = { id: "usr-1" };
      const dto = { organizationId: "org-2" };

      mockPrisma.client.member.findFirst.mockResolvedValue({
        id: "mem-2",
        role: "OWNER",
        organizationId: "org-2",
      });

      mockPrisma.client.organization.findUnique.mockResolvedValue({
        id: "org-2",
        name: "Org Two",
        slug: "org-two",
        logo: null,
      });

      mockPrisma.client.user.update.mockResolvedValue({ id: "usr-1", activeOrganizationId: "org-2" });

      const result = await useCase.switchOrganization(v3Context, user, dto);

      expect(result.success).toBe(true);
      expect(result.activeOrganization.id).toBe("org-2");
      expect(mockPrisma.client.user.update).toHaveBeenCalledWith({
        where: { id: "usr-1" },
        data: { activeOrganizationId: "org-2" },
      });
    });

    it("should throw ForbiddenException if user is not a member of target org", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(
        useCase.switchOrganization({}, { id: "usr-1" }, { organizationId: "unauthorized-org" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("registerDevice", () => {
    it("should create device registry for new android app device", async () => {
      const v3Context = { organizationId: "org-1", memberId: "mem-1" };
      const dto = {
        deviceId: "android-hardware-123",
        modelName: "Pixel 8 Pro",
        osVersion: "Android 14",
        appVersion: "2.1.0",
        pushToken: "fcm-token-abc",
      };

      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc-1" });
      mockPrisma.client.deviceRegistry.findFirst.mockResolvedValue(null);
      mockPrisma.client.deviceRegistry.create.mockResolvedValue({
        id: "dev-reg-1",
        serialNumber: "android-hardware-123",
        deviceName: "Pixel 8 Pro",
        status: "ACTIVE",
        metadata: { appVersion: "2.1.0" },
        lastSeenAt: new Date(),
      });

      const result = await useCase.registerDevice(v3Context, dto);

      expect(result.success).toBe(true);
      expect(result.device.deviceId).toBe("android-hardware-123");
      expect(mockPrisma.client.deviceRegistry.create).toHaveBeenCalled();
    });
  });

  describe("getDashboardSummary", () => {
    it("should return aggregated operational dashboard stats", async () => {
      const v3Context = { organizationId: "org-1" };

      mockPrisma.client.transaction.aggregate.mockResolvedValue({
        _sum: { totalPaid: 1500.5 },
        _count: { _all: 12 },
      });
      mockPrisma.client.productVariantStock.count.mockResolvedValue(3);
      mockPrisma.client.customer.count.mockResolvedValue(42);

      const result = await useCase.getDashboardSummary(v3Context);

      expect(result.todaySales.totalAmount).toBe(1500.5);
      expect(result.todaySales.transactionCount).toBe(12);
      expect(result.lowStockCount).toBe(3);
      expect(result.totalCustomers).toBe(42);
    });
  });
});
