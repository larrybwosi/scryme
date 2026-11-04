import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { WhatsappService } from "../whatsapp.service";
import { PrismaService } from "@/prisma/prisma.service";
import { WhatsappCloudApiProvider } from "../../../domain/whatsapp-cloud-api.provider";
import axios from "axios";

vi.mock("axios");

describe("WhatsappService - syncTemplates Optimization Tests", () => {
  let service: WhatsappService;

  const mockPrisma = {
    integrationDefinition: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    organizationIntegration: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    whatsappTemplate: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    crmRecord: {
      findFirst: vi.fn(),
    },
    communicationThread: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    communicationMessage: {
      upsert: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockProvider = {
    sendMessage: vi.fn(),
    parseWebhookEvent: vi.fn(),
    parseStatusUpdates: vi.fn(),
    verifyWebhookSignature: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: PrismaService, useValue: { client: mockPrisma } },
        { provide: WhatsappCloudApiProvider, useValue: mockProvider },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    vi.clearAllMocks();
  });

  describe("syncTemplates", () => {
    it("should parallelize template upserts via Promise.all when fetching templates from Meta", async () => {
      const organizationId = "org-123";
      const mockDefinition = { id: "def-whatsapp", slug: "whatsapp" };
      const mockIntegration = {
        id: "int-123",
        organizationId,
        isActive: true,
        credentials: {
          phoneNumberId: "phone-123",
          accessToken: "token-abc",
          wabaId: "waba-456",
        },
      };

      const mockTemplatesFromMeta = [
        {
          name: "invoice_notification",
          language: "en_US",
          category: "UTILITY",
          status: "APPROVED",
          components: [{ type: "BODY", text: "Invoice {{1}}" }],
        },
        {
          name: "order_update",
          language: "en_US",
          category: "UTILITY",
          status: "APPROVED",
          components: [{ type: "BODY", text: "Order {{1}} status" }],
        },
        {
          name: "welcome_promo",
          language: "es_ES",
          category: "MARKETING",
          status: "APPROVED",
          components: [{ type: "BODY", text: "Hola {{1}}" }],
        },
      ];

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue(mockDefinition);
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);

      vi.mocked(axios.get).mockResolvedValue({
        data: { data: mockTemplatesFromMeta },
      });

      mockPrisma.whatsappTemplate.upsert.mockImplementation((args) =>
        Promise.resolve({ id: `tpl-${args.where.organizationId_name_language.name}` }),
      );

      const mockSyncedResult = [
        { id: "tpl-1", name: "invoice_notification" },
        { id: "tpl-2", name: "order_update" },
        { id: "tpl-3", name: "welcome_promo" },
      ];
      mockPrisma.whatsappTemplate.findMany.mockResolvedValue(mockSyncedResult);

      const result = await service.syncTemplates(organizationId);

      expect(axios.get).toHaveBeenCalledWith(
        "https://graph.facebook.com/v23.0/waba-456/message_templates",
        { headers: { Authorization: "Bearer token-abc" } },
      );

      expect(mockPrisma.whatsappTemplate.upsert).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSyncedResult);
    });
  });

  describe("processIncomingWebhook Callback and Status Tests", () => {
    it("should process delivery status updates", async () => {
      mockProvider.parseWebhookEvent.mockResolvedValue([]);
      mockProvider.parseStatusUpdates.mockResolvedValue([
        {
          externalId: "wamid.msg.1",
          status: "DELIVERED",
          timestamp: 1672531199,
        },
        {
          externalId: "wamid.msg.2",
          status: "READ",
          timestamp: 1672531200,
        },
      ]);

      mockPrisma.communicationMessage.findFirst.mockImplementation((args) =>
        Promise.resolve({ id: `db-${args.where.externalId}`, metadata: {} }),
      );
      mockPrisma.communicationMessage.update.mockResolvedValue({});

      const res = await service.processIncomingWebhook({});

      expect(res).toEqual({ ok: true });
      expect(mockPrisma.communicationMessage.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.communicationMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "DELIVERED",
          }),
        }),
      );
    });

    it("should trigger automated welcome reply for a new conversation thread", async () => {
      const mockParsedMessages = [
        {
          externalId: "wmid.new.1",
          text: "Hi there!",
          metadata: {
            phoneNumberId: "phone-id-welcome",
            from: "254712345678",
            contactName: "John",
          },
        },
      ];

      const mockIntegration = {
        id: "int-welcome",
        organizationId: "org-welcome-test",
        isActive: true,
        credentials: { phoneNumberId: "phone-id-welcome" },
        settings: {
          enableWelcomeReply: true,
          welcomeMessage: "Welcome to Scryme Store!",
        },
      };

      mockProvider.parseWebhookEvent.mockResolvedValue(mockParsedMessages);
      mockProvider.parseStatusUpdates.mockResolvedValue([]);
      mockPrisma.organizationIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockPrisma.crmRecord.findFirst.mockResolvedValue(null);
      mockPrisma.communicationThread.findFirst.mockResolvedValue(null); // New thread
      mockPrisma.communicationThread.upsert.mockResolvedValue({ id: "thread-welcome" });
      mockPrisma.communicationMessage.upsert.mockResolvedValue({ id: "msg-welcome" });

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue({ id: "def-whatsapp" });
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);
      mockProvider.sendMessage.mockResolvedValue({ externalId: "wamid.auto.reply" });
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: "msg-auto-reply" });

      const res = await service.processIncomingWebhook({});

      expect(res).toEqual({ ok: true });
      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        mockIntegration,
        expect.objectContaining({
          text: "Welcome to Scryme Store!",
          threadId: "254712345678",
        }),
      );
    });
  });

  describe("sendPaymentReceiptNotification & sendDeliveryStatusNotification", () => {
    it("should send payment receipt notification with correct template and payload", async () => {
      const mockIntegration = {
        organizationId: "org-123",
        isActive: true,
        credentials: { phoneNumberId: "phone-123", accessToken: "token-123" },
      };

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue({ id: "def-1" });
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);
      mockProvider.sendMessage.mockResolvedValue({ externalId: "wmid.pay.1" });
      mockPrisma.communicationThread.upsert.mockResolvedValue({ id: "thread-pay" });
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: "msg-pay" });

      const res = await service.sendPaymentReceiptNotification(
        "org-123",
        "TXN-100",
        "+254700112233",
        1500,
        "KES",
        "https://pay.scryme.tech/receipts/100",
      );

      expect(res).toBeDefined();
      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        mockIntegration,
        expect.objectContaining({
          templateName: "payment_receipt",
          threadId: "254700112233",
        }),
      );
    });

    it("should send delivery status notification with correct parameters", async () => {
      const mockIntegration = {
        organizationId: "org-123",
        isActive: true,
        credentials: { phoneNumberId: "phone-123", accessToken: "token-123" },
      };

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue({ id: "def-1" });
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);
      mockProvider.sendMessage.mockResolvedValue({ externalId: "wmid.deliv.1" });
      mockPrisma.communicationThread.upsert.mockResolvedValue({ id: "thread-deliv" });
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: "msg-deliv" });

      const res = await service.sendDeliveryStatusNotification(
        "org-123",
        "TRK-999",
        "+254700112233",
        "DISPATCHED",
        "Tomorrow morning",
      );

      expect(res).toBeDefined();
      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        mockIntegration,
        expect.objectContaining({
          templateName: "delivery_status_update",
          threadId: "254700112233",
        }),
      );
    });
  });

  describe("verifyConfig", () => {
    it("should return disconnected state when no integration exists", async () => {
      mockPrisma.integrationDefinition.findUnique.mockResolvedValue(null);
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(null);

      const res = await service.verifyConfig("org-none");

      expect(res).toEqual({
        isConfigured: false,
        isActive: false,
        phoneNumberId: null,
        wabaId: null,
        syncStatus: "DISCONNECTED",
        multitenancyValid: true,
      });
    });

    it("should return active and configured state for valid organization integration", async () => {
      const mockIntegration = {
        organizationId: "org-123",
        isActive: true,
        syncStatus: "CONNECTED",
        credentials: {
          phoneNumberId: "phone-999",
          accessToken: "token-abc",
          wabaId: "waba-777",
        },
      };

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue({ id: "def-1" });
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);

      const res = await service.verifyConfig("org-123");

      expect(res).toEqual({
        isConfigured: true,
        isActive: true,
        phoneNumberId: "phone-999",
        wabaId: "waba-777",
        syncStatus: "CONNECTED",
        multitenancyValid: true,
      });
    });
  });
});
