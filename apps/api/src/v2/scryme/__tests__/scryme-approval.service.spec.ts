import { Test, TestingModule } from "@nestjs/testing";
import { ScrymeApprovalService } from "../scryme-approval.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { describe, it, expect, beforeEach, vi, type MockInstance } from "vitest";

describe("ScrymeApprovalService", () => {
  let service: ScrymeApprovalService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      approvalRequest: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      departmentMember: {
        findFirst: vi.fn(),
      },
      scrymeMessage: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      approvalDecision: {
        update: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrymeApprovalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScrymeApprovalService>(ScrymeApprovalService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("notifyApprovers", () => {
    it("should return early if request does not exist or configuration is inactive", async () => {
      mockPrisma.client.approvalRequest.findFirst.mockResolvedValue(null);

      const result = await service.notifyApprovers("org-1", "req-1");
      expect(result).toBeUndefined();
      expect(mockPrisma.client.scrymeMessage.create).not.toHaveBeenCalled();
    });

    it("should notify pending approvers concurrently using Promise.all", async () => {
      const mockRequest = {
        id: "req-123",
        relatedRecordNumber: "PO-100",
        requesterId: "req-user-1",
        currency: "USD",
        amount: 500,
        requestType: "PURCHASE_ORDER",
        currentStep: 1,
        scrymeThreadId: "thread-root",
        requester: {
          user: { name: "John Doe", email: "john@test.com" },
        },
        organization: {
          scrymeConfiguration: {
            isActive: true,
            workspaceSlug: "test-workspace",
          },
        },
        decisions: [
          {
            id: "dec-1",
            stepNumber: 1,
            approverId: "app-1",
            approver: {
              user: {
                id: "usr-app-1",
                email: "approver1@test.com",
                scrymeUserId: "scryme-user-1",
              },
            },
          },
          {
            id: "dec-2",
            stepNumber: 1,
            approverId: "app-2",
            approver: {
              user: {
                id: "usr-app-2",
                email: "approver2@test.com",
                scrymeUserId: null, // Test user update
              },
            },
          },
        ],
      };

      mockPrisma.client.approvalRequest.findFirst.mockResolvedValue(mockRequest);
      mockPrisma.client.departmentMember.findFirst.mockResolvedValue(null);
      mockPrisma.client.scrymeMessage.findFirst.mockResolvedValue(null);

      // Mock client methods
      const mockFindUser = vi.spyOn(service["scrymeClient"], "findUserByEmail").mockResolvedValue({
        id: "scryme-user-2",
        email: "approver2@test.com",
      } as any);

      const mockGetDMChannel = vi.spyOn(service["scrymeClient"], "getDirectMessageChannel").mockImplementation(async (_workspace, userId) => {
        return { slug: `dm-${userId}` } as any;
      });

      const mockSendMessage = vi.spyOn(service["scrymeClient"], "sendMessage").mockResolvedValue({
        id: "msg-id",
      } as any);

      await service.notifyApprovers("org-1", "req-123");

      // Verify users were looked up and updated if lacking scrymeUserId
      expect(mockFindUser).toHaveBeenCalledWith("test-workspace", "approver2@test.com");
      expect(mockPrisma.client.user.update).toHaveBeenCalledWith({
        where: { id: "usr-app-2" },
        data: { scrymeUserId: "scryme-user-2" },
      });

      // Verify messages were sent to each approver
      expect(mockGetDMChannel).toHaveBeenCalledTimes(2);
      expect(mockSendMessage).toHaveBeenCalledTimes(2);

      // Verify decisions and message logs are recorded in parallel
      expect(mockPrisma.client.approvalDecision.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.client.scrymeMessage.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("updateStepMessages", () => {
    it("should update decision messages concurrently using Promise.all", async () => {
      const mockRequest = {
        id: "req-123",
        relatedRecordNumber: "PO-100",
        organization: {
          scrymeConfiguration: {
            isActive: true,
            workspaceSlug: "test-workspace",
          },
        },
        decisions: [
          {
            id: "dec-1",
            approverId: "app-1",
            status: "APPROVED",
            comments: "Looks good!",
            scrymeMessageId: "msg-1",
            scrymeChannelId: "channel-1",
            approver: {
              user: { name: "Approver One", email: "app1@test.com" },
            },
          },
          {
            id: "dec-2",
            approverId: "app-2",
            status: "PENDING",
            comments: null,
            scrymeMessageId: "msg-2",
            scrymeChannelId: "channel-2",
            approver: {
              user: { name: "Approver Two", email: "app2@test.com" },
            },
          },
        ],
      };

      mockPrisma.client.approvalRequest.findFirst.mockResolvedValue(mockRequest);

      const mockUpdateMessage = vi.spyOn(service["scrymeClient"], "updateMessage").mockResolvedValue({} as any);

      await service.updateStepMessages("org-1", "req-123", "app-1", 1);

      // Verify updateMessage was called concurrently for both message-associated decisions
      expect(mockUpdateMessage).toHaveBeenCalledTimes(2);
      expect(mockUpdateMessage).toHaveBeenNthCalledWith(
        1,
        "test-workspace",
        "channel-1",
        "msg-1",
        expect.objectContaining({
          content: expect.stringContaining("Approved by Approver One"),
        })
      );
    });
  });
});
