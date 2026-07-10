import { Test, TestingModule } from "@nestjs/testing";
import { InvitationUseCase } from "../invitation.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { InvitationStatus, MemberRole } from "@repo/db";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/windmill/server", () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("InvitationUseCase", () => {
  let useCase: InvitationUseCase;
  let prisma: PrismaService;

  const mockRedis = {
    del: vi.fn(),
  };

  const mockPrisma = {
    client: {
      invitation: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationUseCase,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get<InvitationUseCase>(InvitationUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  describe("acceptInvitation", () => {
    it("should accept invitation successfully when emails match", async () => {
      const dto = { token: "valid-token" };
      const userId = "user-123";
      const invitation = {
        id: "inv-1",
        email: "test@example.com",
        organizationId: "org-1",
        role: MemberRole.EMPLOYEE,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      };

      mockPrisma.client.invitation.findUnique.mockResolvedValue(invitation);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: userId,
        email: "test@example.com",
      });
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      const result = await useCase.acceptInvitation(dto, userId);

      expect(mockPrisma.client.member.create).toHaveBeenCalled();
      expect(mockPrisma.client.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv-1" },
        data: { status: InvitationStatus.ACCEPTED },
      });
    });

    it("should throw ForbiddenException when emails do not match (hijacking)", async () => {
      const dto = { token: "valid-token" };
      const userId = "attacker-123";
      const invitation = {
        id: "inv-1",
        email: "victim@example.com",
        organizationId: "org-1",
        role: MemberRole.EMPLOYEE,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      };

      mockPrisma.client.invitation.findUnique.mockResolvedValue(invitation);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: userId,
        email: "attacker@example.com",
      });

      await expect(useCase.acceptInvitation(dto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw BadRequestException if user is already a member", async () => {
      const dto = { token: "valid-token" };
      const userId = "user-123";
      const invitation = {
        id: "inv-1",
        email: "test@example.com",
        organizationId: "org-1",
        role: MemberRole.EMPLOYEE,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      };

      mockPrisma.client.invitation.findUnique.mockResolvedValue(invitation);
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: userId,
        email: "test@example.com",
      });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "existing-member" });

      await expect(useCase.acceptInvitation(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.client.member.create).not.toHaveBeenCalled();
    });
  });

  describe("createInvitation", () => {
    it("should not allow mass assignment of sensitive fields", async () => {
      const dto = {
        email: "new@example.com",
        role: MemberRole.EMPLOYEE,
        expiresAt: new Date().toISOString(),
        organizationId: "evil-org", // Mass assignment attempt
      } as any;

      mockPrisma.client.member.findFirst.mockResolvedValue(null);
      mockPrisma.client.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.client.invitation.create.mockResolvedValue({ id: "inv-2" });

      await useCase.createInvitation("real-org", dto, "inviter-id", "inviter-user-id");

      expect(mockPrisma.client.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "real-org",
          }),
        }),
      );

      // Verify that organizationId from dto was NOT used
      const callArgs = mockPrisma.client.invitation.create.mock.calls[0][0];
      expect(callArgs.data.organizationId).toBe("real-org");
    });
  });
});
