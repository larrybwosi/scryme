import { vi, describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CommunicationIntegrationService } from "../communication-integration.service";
import { SlackProvider } from "../../../infrastructure/providers/slack.provider";
import { PrismaService } from "@/prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("CommunicationIntegrationService - Security Tests", () => {
  let service: CommunicationIntegrationService;

  const mockPrisma = {
    crmActivity: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    organizationIntegration: {
      findFirst: vi.fn(),
    },
  };

  const mockSlackProvider = {
    slug: "slack",
    getAuthUrl: vi.fn(),
    handleCallback: vi.fn(),
    sendMessage: vi.fn(),
    parseWebhookEvent: vi.fn(),
    getUserEmail: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationIntegrationService,
        { provide: PrismaService, useValue: { client: mockPrisma } },
        { provide: SlackProvider, useValue: mockSlackProvider },
      ],
    }).compile();

    service = module.get<CommunicationIntegrationService>(
      CommunicationIntegrationService,
    );
    vi.clearAllMocks();
  });

  describe("replyToActivity (IDOR & Multi-tenancy Isolation)", () => {
    it("should query with both activityId and organizationId using findFirst to prevent IDOR", async () => {
      mockPrisma.crmActivity.findFirst.mockResolvedValue(null);

      await expect(
        service.replyToActivity("org-1", "activity-1", "Hello"),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.crmActivity.findFirst).toHaveBeenCalledWith({
        where: { id: "activity-1", organizationId: "org-1" },
        include: { record: true },
      });
    });

    it("should successfully send message and log reply if activity belongs to organization", async () => {
      const mockActivity = {
        id: "activity-1",
        organizationId: "org-1",
        recordId: "record-1",
        metadata: {
          provider: "slack",
          threadId: "thread-123",
          channelId: "channel-456",
        },
      };

      const mockIntegration = {
        id: "integration-1",
        organizationId: "org-1",
        isActive: true,
      };

      const mockResult = {
        externalId: "ext-reply-123",
        threadId: "thread-123",
      };

      mockPrisma.crmActivity.findFirst.mockResolvedValue(mockActivity);
      mockPrisma.organizationIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockSlackProvider.sendMessage.mockResolvedValue(mockResult);
      mockPrisma.crmActivity.create.mockResolvedValue({ id: "reply-activity-1" });

      const result = await service.replyToActivity("org-1", "activity-1", "Replying back");

      expect(mockPrisma.crmActivity.findFirst).toHaveBeenCalledWith({
        where: { id: "activity-1", organizationId: "org-1" },
        include: { record: true },
      });

      expect(mockPrisma.organizationIntegration.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          integrationDefinition: { slug: "slack" },
          isActive: true,
        },
      });

      expect(mockSlackProvider.sendMessage).toHaveBeenCalledWith(mockIntegration, {
        text: "Replying back",
        threadId: "thread-123",
        channelId: "channel-456",
      });

      expect(mockPrisma.crmActivity.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          recordId: "record-1",
          type: "REPLY",
          description: "Replying back",
          metadata: {
            provider: "slack",
            threadId: "thread-123",
            channelId: "channel-456",
            externalId: "ext-reply-123",
            isReply: true,
          },
        },
      });

      expect(result).toEqual({ id: "reply-activity-1" });
    });
  });
});
