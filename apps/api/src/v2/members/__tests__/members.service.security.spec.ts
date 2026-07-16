import { Test, TestingModule } from "@nestjs/testing";
import { MembersService } from "../members.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { V2ApiContext } from "@repo/shared/api/v2";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberRole } from "@repo/db";

describe("MembersService Security", () => {
  let service: MembersService;
  let prisma: any;

  const mockPrisma = {
    client: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };

  const mockRedis = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const ctx: V2ApiContext = {
    organizationId: "org-1",
    userId: "user-1",
    permissions: [],
  };

  describe("createMember", () => {
    it("should prevent mass assignment of sensitive fields", async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({ id: "user-2", email: "test@example.com" });
      mockPrisma.client.member.create.mockResolvedValue({ id: "member-2" });

      await service.createMember(ctx, {
        email: "test@example.com",
        name: "Test User",
        organizationId: "malicious-org", // Attempt to hijack organization
        userId: "malicious-user",
        extraField: "hack",
      } as any);

      expect(mockPrisma.client.member.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1", // Must use organizationId from ctx
          userId: "user-2",
        }),
      });

      const callData = mockPrisma.client.member.create.mock.calls[0][0].data;
      expect(callData.extraField).toBeUndefined();
      expect(callData.organizationId).toBe("org-1");
    });
  });

  describe("updateMember", () => {
    it("should enforce multi-tenant isolation using updateMany", async () => {
      mockPrisma.client.member.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member-1", organizationId: "org-1" });

      await service.updateMember(ctx, "member-1", { phone: "123456" });

      expect(mockPrisma.client.member.updateMany).toHaveBeenCalledWith({
        where: { id: "member-1", organizationId: "org-1" },
        data: expect.objectContaining({ phone: "123456" }),
      });
    });

    it("should throw NotFoundException if member does not belong to organization", async () => {
      mockPrisma.client.member.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.updateMember(ctx, "member-other", { phone: "123456" }))
        .rejects.toThrow(NotFoundException);
    });

    it("should prevent mass assignment of internal fields during update", async () => {
      mockPrisma.client.member.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member-1", organizationId: "org-1" });

      await service.updateMember(ctx, "member-1", {
        organizationId: "new-org",
        userId: "new-user",
        phone: "654321",
      } as any);

      const updateData = mockPrisma.client.member.updateMany.mock.calls[0][0].data;
      expect(updateData.organizationId).toBeUndefined();
      expect(updateData.userId).toBeUndefined();
      expect(updateData.phone).toBe("654321");
    });
  });

  describe("deleteMember", () => {
    it("should enforce multi-tenant isolation", async () => {
      mockPrisma.client.member.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteMember(ctx, "member-other"))
        .rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.member.updateMany).toHaveBeenCalledWith({
        where: { id: "member-other", organizationId: "org-1" },
        data: expect.objectContaining({ isActive: false }),
      });
    });
  });
});
