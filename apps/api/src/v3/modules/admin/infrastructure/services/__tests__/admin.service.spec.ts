import { AdminService } from "../admin.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { MembershipStatus } from "@repo/db";

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
});
