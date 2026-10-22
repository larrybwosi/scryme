import { vi, describe, it, expect, beforeEach } from "vitest";
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
      findUnique: vi.fn(),
    },
    organizationIntegration: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
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
    },
    communicationMessage: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockProvider = {
    sendMessage: vi.fn(),
    parseWebhookEvent: vi.fn(),
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

      // Verify that upsert was called 3 times concurrently for all templates
      expect(mockPrisma.whatsappTemplate.upsert).toHaveBeenCalledTimes(3);
      expect(mockPrisma.whatsappTemplate.upsert).toHaveBeenNthCalledWith(1, {
        where: {
          organizationId_name_language: {
            organizationId: "org-123",
            name: "invoice_notification",
            language: "en_US",
          },
        },
        create: {
          organizationId: "org-123",
          name: "invoice_notification",
          category: "UTILITY",
          language: "en_US",
          status: "APPROVED",
          components: [{ type: "BODY", text: "Invoice {{1}}" }],
        },
        update: {
          category: "UTILITY",
          status: "APPROVED",
          components: [{ type: "BODY", text: "Invoice {{1}}" }],
        },
      });

      expect(result).toEqual(mockSyncedResult);
    });
  });

  describe("processIncomingWebhook Optimization Tests", () => {
    it("should cache organizationIntegration queries by phoneNumberId and call findFirst only once for multiple messages", async () => {
      const mockWebhookPayload = { entry: [{ id: "123" }] };
      const mockParsedMessages = [
        {
          externalId: "wmid.1",
          text: "Hello message 1",
          metadata: {
            phoneNumberId: "phone-id-999",
            from: "1234567890",
            contactName: "Alice",
          },
        },
        {
          externalId: "wmid.2",
          text: "Hello message 2",
          metadata: {
            phoneNumberId: "phone-id-999",
            from: "1234567890",
            contactName: "Alice",
          },
        },
        {
          externalId: "wmid.3",
          text: "Hello message 3",
          metadata: {
            phoneNumberId: "phone-id-999",
            from: "0987654321",
            contactName: "Bob",
          },
        },
      ];

      const mockIntegration = {
        id: "int-wh-1",
        organizationId: "org-whatsapp-test",
        isActive: true,
        credentials: { phoneNumberId: "phone-id-999" },
      };

      mockProvider.parseWebhookEvent.mockResolvedValue(mockParsedMessages);
      mockPrisma.organizationIntegration.findFirst.mockResolvedValue(mockIntegration);
      mockPrisma.crmRecord.findFirst.mockResolvedValue(null);
      mockPrisma.communicationThread.upsert.mockResolvedValue({ id: "thread-1" });
      mockPrisma.communicationMessage.upsert.mockResolvedValue({ id: "msg-1" });

      const res = await service.processIncomingWebhook(mockWebhookPayload);

      expect(res).toEqual({ ok: true });

      // Verify that organizationIntegration.findFirst was called ONLY ONCE despite 3 messages in the batch
      expect(mockPrisma.organizationIntegration.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrisma.organizationIntegration.findFirst).toHaveBeenCalledWith({
        where: {
          integrationDefinition: { slug: "whatsapp" },
          isActive: true,
          credentials: { path: ["phoneNumberId"], equals: "phone-id-999" },
        },
      });

      // Verify message upsert was processed 3 times
      expect(mockPrisma.communicationMessage.upsert).toHaveBeenCalledTimes(3);
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

  describe("sendPurchaseOrderNotification", () => {
    it("should send notification using recipientPhoneOverride when provided", async () => {
      const mockIntegration = {
        organizationId: "org-123",
        isActive: true,
        credentials: { phoneNumberId: "phone-123", accessToken: "token-123" },
      };

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue({ id: "def-1" });
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);
      mockProvider.sendMessage.mockResolvedValue({ externalId: "wmid.po.123" });
      mockPrisma.communicationThread.upsert.mockResolvedValue({ id: "thread-po-1" });
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: "msg-po-1" });

      const result = await service.sendPurchaseOrderNotification(
        "org-123",
        "PO-1001",
        undefined,
        5000,
        undefined,
        "+254712345678"
      );

      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        mockIntegration,
        expect.objectContaining({
          threadId: "254712345678",
          templateName: "purchase_order_issued",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "PO-1001" },
                { type: "text", text: "5000" },
              ],
            },
          ],
        })
      );
      expect(result).toBeDefined();
    });

    it("should fetch purchase order and supplier phone if phone is missing", async () => {
      const mockIntegration = {
        organizationId: "org-123",
        isActive: true,
        credentials: { phoneNumberId: "phone-123", accessToken: "token-123" },
      };

      const mockPo = {
        id: "po-123",
        purchaseNumber: "PO-2002",
        totalAmount: 12500,
        supplier: { phone: "+254799988877" },
      };

      mockPrisma.integrationDefinition.findUnique.mockResolvedValue({ id: "def-1" });
      mockPrisma.organizationIntegration.findUnique.mockResolvedValue(mockIntegration);
      mockPrisma.purchase = { findFirst: vi.fn().mockResolvedValue(mockPo) };
      mockProvider.sendMessage.mockResolvedValue({ externalId: "wmid.po.456" });
      mockPrisma.communicationThread.upsert.mockResolvedValue({ id: "thread-po-2" });
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: "msg-po-2" });

      const result = await service.sendPurchaseOrderNotification(
        "org-123",
        "PO-2002",
        undefined,
        undefined,
        "po-123"
      );

      expect(mockPrisma.purchase.findFirst).toHaveBeenCalledWith({
        where: { id: "po-123", organizationId: "org-123" },
        include: { supplier: true },
      });
      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        mockIntegration,
        expect.objectContaining({
          threadId: "254799988877",
          templateName: "purchase_order_issued",
        })
      );
      expect(result).toBeDefined();
    });
  });
});