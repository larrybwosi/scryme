import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScrymeService } from "../scryme.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScrymeApprovalService } from "../scryme-approval.service";
import { BookingService } from "../../../v3/modules/services/application/services/booking.service";
import { createHmac } from "crypto";
import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

describe("ScrymeService", () => {
  let service: ScrymeService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      scrymeConfiguration: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
      },
      workflowEngineExecution: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      approvalDecision: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      department: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      inventoryLocation: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  const mockScrymeApprovalService = {
    notifyApprovers: vi.fn(),
    updateStepMessages: vi.fn(),
    notifyRequester: vi.fn(),
  };

  const mockBookingService = {
    respondToAssignment: vi.fn(),
    updateBookingStatus: vi.fn(),
    completeBooking: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrymeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ScrymeApprovalService, useValue: mockScrymeApprovalService },
        { provide: BookingService, useValue: mockBookingService },
      ],
    }).compile();

    service = module.get<ScrymeService>(ScrymeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("handleWebhook", () => {
    const payload = {
      event: "message.action",
      data: {
        workspaceSlug: "org-test",
        action: { id: "test-action" },
        message: { id: "msg-1" },
        user: { id: "user-1" },
      },
    };

    it("should verify signature correctly", async () => {
      const secret = "test-secret";
      process.env.SCRYME_WEBHOOK_SECRET = secret;

      const signature = createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {},
      });

      const result = await service.handleWebhook(signature, payload);
      expect(result.status).toBe("success");
      expect(mockPrisma.client.workflowEngineExecution.create).toHaveBeenCalled();

      delete process.env.SCRYME_WEBHOOK_SECRET;
    });

    it("should throw BadRequestException for invalid signature", async () => {
      process.env.SCRYME_WEBHOOK_SECRET = "test-secret";

      await expect(
        service.handleWebhook("invalid-sig", payload),
      ).rejects.toThrow(BadRequestException);

      delete process.env.SCRYME_WEBHOOK_SECRET;
    });

    it("should prevent cross-tenant IDOR for approve decision actions", async () => {
      const decisionPayload = {
        event: "message.action",
        data: {
          workspaceSlug: "org-test",
          action: { id: "approve:dec-123", value: "dec-123" },
          message: { id: "msg-1" },
          user: { email: "approver@test.com" },
        },
      };

      // Mock configuration lookup
      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {},
      });

      mockPrisma.client.approvalDecision.findFirst.mockResolvedValue(null);

      await expect(
        service.handleWebhook("", decisionPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it("should process approve_perm interactive action and grant member access (IDOR protected)", async () => {
      const approvePayload = {
        event: "message.action",
        data: {
          workspaceSlug: "org-test",
          action: { id: "approve_perm:ADMIN:member-123", value: "ADMIN" },
          message: { id: "msg-101", channelSlug: "admins", content: "Access Request" },
          user: { id: "admin-1", name: "Org Owner", email: "owner@test.com" },
        },
      };

      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {},
      });

      mockPrisma.client.member.findFirst.mockResolvedValue({
        id: "member-123",
        role: "EMPLOYEE",
        organizationId: "org-1",
      });

      mockPrisma.client.member.update.mockResolvedValue({
        id: "member-123",
        role: "ADMIN",
        membershipStatus: "ACTIVE",
        isActive: true,
      });

      const updateMsgSpy = vi
        .spyOn(service["scrymeClient"], "updateMessage")
        .mockResolvedValue({} as any);

      const result = await service.handleWebhook("", approvePayload);

      expect(result.status).toBe("success");
      expect(mockPrisma.client.member.findFirst).toHaveBeenCalledWith({
        where: { id: "member-123", organizationId: "org-1" },
      });
      expect(mockPrisma.client.member.update).toHaveBeenCalledWith({
        where: { id: "member-123" },
        data: {
          role: "ADMIN",
          membershipStatus: "ACTIVE",
          isActive: true,
        },
      });
      expect(updateMsgSpy).toHaveBeenCalledWith(
        "org-test",
        "admins",
        "msg-101",
        expect.objectContaining({
          actions: [],
        }),
      );
    });

    it("should process decline_perm interactive action", async () => {
      const declinePayload = {
        event: "message.action",
        data: {
          workspaceSlug: "org-test",
          action: { id: "decline_perm:member-123" },
          message: { id: "msg-102", channelSlug: "admins", content: "Access Request" },
          user: { id: "admin-1", name: "Org Owner" },
        },
      };

      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {},
      });

      mockPrisma.client.member.findFirst.mockResolvedValue({
        id: "member-123",
        organizationId: "org-1",
      });

      const updateMsgSpy = vi
        .spyOn(service["scrymeClient"], "updateMessage")
        .mockResolvedValue({} as any);

      const result = await service.handleWebhook("", declinePayload);

      expect(result.status).toBe("success");
      expect(updateMsgSpy).toHaveBeenCalledWith(
        "org-test",
        "admins",
        "msg-102",
        expect.objectContaining({
          actions: [],
        }),
      );
    });

    it("should throw BadRequestException for approve_perm when member does not belong to org (IDOR protection)", async () => {
      const idorPayload = {
        event: "message.action",
        data: {
          workspaceSlug: "org-test",
          action: { id: "approve_perm:ADMIN:other-org-member" },
          message: { id: "msg-103", channelSlug: "admins" },
          user: { id: "admin-1" },
        },
      };

      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {},
      });

      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(service.handleWebhook("", idorPayload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should prevent cross-tenant IDOR for Windmill execution resume actions", async () => {
      const resumePayload = {
        event: "message.action",
        data: {
          workspaceSlug: "org-test",
          action: { id: "wm_resume:job-123", value: "token-abc" },
          message: { id: "msg-1", channelSlug: "notifications" },
          user: { id: "user-1", name: "User 1" },
        },
      };

      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {},
      });

      mockPrisma.client.workflowEngineExecution.findFirst.mockResolvedValue(null);

      vi.spyOn(service["scrymeClient"], "updateMessage").mockResolvedValue({} as any);

      const result = await service.handleWebhook("", resumePayload);
      expect(result.status).toBe("success");
      expect(mockPrisma.client.workflowEngineExecution.findFirst).toHaveBeenCalledWith({
        where: { id: "job-123", organizationId: "org-1" },
      });
    });
  });

  describe("provisionChannelForEntity (IDOR defense)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should query department scoped to organizationId (IDOR protection)", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        workspaceSlug: "test-workspace",
        isActive: true,
      });

      mockPrisma.client.department.findFirst.mockResolvedValue({
        id: "dept-123",
        name: "Engineering",
        scrymeChannelId: null,
      });

      vi.spyOn(service["scrymeClient"], "createChannel").mockResolvedValue({
        id: "channel-123",
      } as any);

      await service.provisionChannelForEntity("org-123", "department", "dept-123");

      expect(mockPrisma.client.department.findFirst).toHaveBeenCalledWith({
        where: { id: "dept-123", organizationId: "org-123" },
      });
      expect(mockPrisma.client.department.update).toHaveBeenCalledWith({
        where: { id: "dept-123" },
        data: { scrymeChannelId: "channel-123" },
      });
    });

    it("should query inventory location scoped to organizationId (IDOR protection)", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        workspaceSlug: "test-workspace",
        isActive: true,
      });

      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-123",
        name: "Warehouse",
        scrymeChannelId: null,
      });

      vi.spyOn(service["scrymeClient"], "createChannel").mockResolvedValue({
        id: "channel-456",
      } as any);

      await service.provisionChannelForEntity("org-123", "location", "loc-123");

      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-123", organizationId: "org-123" },
      });
      expect(mockPrisma.client.inventoryLocation.update).toHaveBeenCalledWith({
        where: { id: "loc-123" },
        data: { scrymeChannelId: "channel-456" },
      });
    });
  });
});
