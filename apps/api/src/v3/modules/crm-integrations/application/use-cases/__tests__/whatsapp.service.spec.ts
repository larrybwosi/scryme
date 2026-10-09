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
    },
    whatsappTemplate: {
      upsert: vi.fn(),
      findMany: vi.fn(),
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
});
