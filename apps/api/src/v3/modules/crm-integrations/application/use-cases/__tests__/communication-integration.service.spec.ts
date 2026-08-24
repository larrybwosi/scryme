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
    crmRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    crmObjectDefinition: {
      findFirst: vi.fn(),
    },
    integrationDefinition: {
      findUnique: vi.fn(),
    },
    organizationIntegration: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
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

  describe("handleOAuthCallback (Credential Persistence & Validation)", () => {
    it("should throw BadRequestException if organizationId or code is missing", async () => {
      await expect(
        service.handleOAuthCallback("slack", "", "code-123"),
      ).rejects.toThrow();

      await expect(
        service.handleOAuthCallback("slack", "org-1", ""),
      ).rejects.toThrow();
    });

    it("should throw NotFoundException if integration definition is missing", async () => {
      mockSlackProvider.handleCallback.mockResolvedValue({
        credentials: { accessToken: "token-123" },
        settings: { channelId: "channel-123" },
      });
      mockPrisma.integrationDefinition.findUnique.mockResolvedValue(null);

      await expect(
        service.handleOAuthCallback("slack", "org-1", "code-123"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should exchange code for credentials and upsert organizationIntegration record", async () => {
      const mockOAuthResult = {
        credentials: { accessToken: "token-123", teamId: "team-123" },
        settings: { channelId: "channel-123" },
      };
      const mockDefinition = { id: "def-123", slug: "slack" };

      mockSlackProvider.handleCallback.mockResolvedValue(mockOAuthResult);
      mockPrisma.integrationDefinition.findUnique.mockResolvedValue(mockDefinition);
      mockPrisma.organizationIntegration.upsert.mockResolvedValue({ id: "org-int-123" });

      const result = await service.handleOAuthCallback("slack", "org-1", "code-123");

      expect(mockSlackProvider.handleCallback).toHaveBeenCalledWith("code-123");
      expect(mockPrisma.integrationDefinition.findUnique).toHaveBeenCalledWith({
        where: { slug: "slack" },
      });
      expect(mockPrisma.organizationIntegration.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_integrationDefinitionId: {
            organizationId: "org-1",
            integrationDefinitionId: "def-123",
          },
        },
        create: expect.objectContaining({
          organizationId: "org-1",
          integrationDefinitionId: "def-123",
          isActive: true,
          credentials: mockOAuthResult.credentials,
          settings: mockOAuthResult.settings,
          syncStatus: "SYNCED",
        }),
        update: expect.objectContaining({
          isActive: true,
          credentials: mockOAuthResult.credentials,
          settings: mockOAuthResult.settings,
          syncStatus: "SYNCED",
        }),
      });

      expect(result).toEqual({ id: "org-int-123" });
    });
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

  describe("handleWebhook (N+1 Query Optimization with Caching)", () => {
    it("should process multiple messages from the same team and only query organizationIntegration once", async () => {
      const mockMessages = [
        {
          senderEmail: "user1@example.com",
          text: "Message 1",
          externalId: "msg-1",
          metadata: { team: "team-123" },
        },
        {
          senderEmail: "user2@example.com",
          text: "Message 2",
          externalId: "msg-2",
          metadata: { team: "team-123" },
        },
      ];

      const mockIntegration = {
        id: "integration-123",
        organizationId: "org-123",
        credentials: { teamId: "team-123" },
      };

      const mockRecord1 = { id: "record-1" };
      const mockRecord2 = { id: "record-2" };

      mockSlackProvider.parseWebhookEvent.mockResolvedValue(mockMessages);
      mockPrisma.organizationIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockPrisma.crmRecord.findFirst
        .mockResolvedValueOnce(mockRecord1)
        .mockResolvedValueOnce(mockRecord2);

      const result = await service.handleWebhook("slack", {}, {});

      expect(result).toEqual({ ok: true });

      // organizationIntegration.findFirst should only be called ONCE due to caching
      expect(mockPrisma.organizationIntegration.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrisma.organizationIntegration.findFirst).toHaveBeenCalledWith({
        where: {
          integrationDefinition: { slug: "slack" },
          credentials: { path: ["teamId"], equals: "team-123" },
        },
        include: { organization: true },
      });

      // crmActivity.create should be called twice, once for each message
      expect(mockPrisma.crmActivity.create).toHaveBeenCalledTimes(2);
    });

    it("should process multiple new records and only query crmObjectDefinition once per organization", async () => {
      const mockMessages = [
        {
          senderEmail: "new1@example.com",
          text: "Message 1",
          externalId: "msg-1",
          metadata: { team: "team-123" },
        },
        {
          senderEmail: "new2@example.com",
          text: "Message 2",
          externalId: "msg-2",
          metadata: { team: "team-123" },
        },
      ];

      const mockIntegration = {
        id: "integration-123",
        organizationId: "org-123",
        credentials: { teamId: "team-123" },
      };

      const mockPersonDef = {
        id: "person-def-123",
        name: "person",
      };

      mockSlackProvider.parseWebhookEvent.mockResolvedValue(mockMessages);
      mockPrisma.organizationIntegration.findFirst.mockResolvedValue(mockIntegration);
      // Both records do not exist initially
      mockPrisma.crmRecord.findFirst.mockResolvedValue(null);
      mockPrisma.crmObjectDefinition.findFirst.mockResolvedValue(mockPersonDef);
      mockPrisma.crmRecord.create
        .mockResolvedValueOnce({ id: "record-new-1" })
        .mockResolvedValueOnce({ id: "record-new-2" });

      const result = await service.handleWebhook("slack", {}, {});

      expect(result).toEqual({ ok: true });

      // crmObjectDefinition.findFirst should only be called ONCE due to caching
      expect(mockPrisma.crmObjectDefinition.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrisma.crmObjectDefinition.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-123",
          name: "person",
        },
      });

      // crmRecord.create should be called for each new email
      expect(mockPrisma.crmRecord.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.crmRecord.create).toHaveBeenNthCalledWith(1, {
        data: {
          organizationId: "org-123",
          objectId: "person-def-123",
          data: { email: "new1@example.com", name: "new1" },
        },
      });
      expect(mockPrisma.crmRecord.create).toHaveBeenNthCalledWith(2, {
        data: {
          organizationId: "org-123",
          objectId: "person-def-123",
          data: { email: "new2@example.com", name: "new2" },
        },
      });
    });
  });
});
