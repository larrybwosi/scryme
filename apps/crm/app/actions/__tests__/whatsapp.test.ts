import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    integrationDefinition: {
      upsert: vi.fn(),
    },
    organizationIntegration: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    communicationThread: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    communicationMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    whatsappTemplate: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn().mockResolvedValue({ organizationId: "org_test_123", memberId: "mem_test_456" }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { db } from "@repo/db";
import {
  getWhatsappConfig,
  saveWhatsappConfig,
  getCommunicationThreads,
  getThreadMessages,
  sendWhatsappMessage,
  syncWhatsappTemplates,
  getWhatsappTemplates,
} from "../whatsapp";

describe("WhatsApp Integration Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWhatsappConfig", () => {
    it("should return configuration when integration exists", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue({
        isActive: true,
        credentials: {
          phoneNumberId: "123456789",
          accessToken: "EAAB_test_token",
          wabaId: "987654321",
          displayPhoneNumber: "+254712345678",
        },
        syncStatus: "CONNECTED",
      });

      const res = await getWhatsappConfig();

      expect(res.success).toBe(true);
      expect(res.data.isConnected).toBe(true);
      expect(res.data.credentials?.phoneNumberId).toBe("123456789");
      expect(res.data.syncStatus).toBe("CONNECTED");
    });

    it("should return DISCONNECTED status when integration does not exist", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue(null);

      const res = await getWhatsappConfig();

      expect(res.success).toBe(true);
      expect(res.data.isConnected).toBe(false);
      expect(res.data.credentials).toBeNull();
      expect(res.data.syncStatus).toBe("DISCONNECTED");
    });
  });

  describe("saveWhatsappConfig", () => {
    it("should return error if phone number ID or access token is missing", async () => {
      const res = await saveWhatsappConfig({ phoneNumberId: "", accessToken: "" });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Phone Number ID and Access Token are required.");
    });

    it("should upsert integration definition and organization integration", async () => {
      (db.integrationDefinition.upsert as any).mockResolvedValue({ id: "def_whatsapp" });
      (db.organizationIntegration.upsert as any).mockResolvedValue({ id: "org_int_1" });

      const res = await saveWhatsappConfig({
        phoneNumberId: "123456",
        accessToken: "token_abc",
        displayPhoneNumber: "+254700000000",
      });

      expect(res.success).toBe(true);
      expect(db.integrationDefinition.upsert).toHaveBeenCalled();
      expect(db.organizationIntegration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            organizationId: "org_test_123",
            integrationDefinitionId: "def_whatsapp",
            isActive: true,
            syncStatus: "CONNECTED",
          }),
        })
      );
    });
  });

  describe("getCommunicationThreads", () => {
    it("should list threads ordered by lastMessageAt descending", async () => {
      const mockThreads = [
        {
          id: "thread_1",
          organizationId: "org_test_123",
          participantPhone: "254712345678",
          lastMessageAt: new Date(),
          unreadCount: 1,
          messages: [{ id: "msg_1", content: "Hello" }],
        },
      ];
      (db.communicationThread.findMany as any).mockResolvedValue(mockThreads);

      const res = await getCommunicationThreads();

      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockThreads);
      expect(db.communicationThread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org_test_123" },
          orderBy: { lastMessageAt: "desc" },
        })
      );
    });
  });

  describe("getThreadMessages", () => {
    it("should mark unread messages as read and return messages", async () => {
      const mockMessages = [
        { id: "msg_1", content: "Hi", direction: "INBOUND", createdAt: new Date() },
      ];
      (db.communicationThread.updateMany as any).mockResolvedValue({ count: 1 });
      (db.communicationMessage.findMany as any).mockResolvedValue(mockMessages);

      const res = await getThreadMessages("thread_1");

      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockMessages);
      expect(db.communicationThread.updateMany).toHaveBeenCalledWith({
        where: { id: "thread_1", organizationId: "org_test_123", unreadCount: { gt: 0 } },
        data: { unreadCount: 0 },
      });
    });
  });

  describe("sendWhatsappMessage", () => {
    it("should require recipient phone and text or template", async () => {
      const res = await sendWhatsappMessage({ recipientPhone: "", text: "" });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Recipient phone and message text or template are required.");
    });

    it("should call Meta API when active integration exists and record outbound message", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue({
        isActive: true,
        credentials: {
          phoneNumberId: "phone_id_123",
          accessToken: "token_123",
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "wamid.12345" }] }),
      });

      (db.communicationThread.findFirst as any).mockResolvedValue(null);
      (db.communicationThread.upsert as any).mockResolvedValue({ id: "thread_1" });
      (db.communicationMessage.create as any).mockResolvedValue({
        id: "msg_sent_1",
        content: "Hello customer",
        status: "SENT",
        externalId: "wamid.12345",
      });

      const res = await sendWhatsappMessage({
        recipientPhone: "+254712345678",
        text: "Hello customer",
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://graph.facebook.com/v23.0/phone_id_123/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token_123",
          }),
        })
      );
      expect(db.communicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            threadId: "thread_1",
            organizationId: "org_test_123",
            direction: "OUTBOUND",
            content: "Hello customer",
            externalId: "wamid.12345",
            senderMemberId: "mem_test_456",
          }),
        })
      );
    });
  });

  describe("syncWhatsappTemplates & getWhatsappTemplates", () => {
    it("should fetch templates from Meta Graph API and upsert them", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue({
        isActive: true,
        credentials: {
          phoneNumberId: "phone_123",
          accessToken: "token_123",
          wabaId: "waba_123",
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { name: "order_update", category: "UTILITY", language: "en_US", status: "APPROVED", components: [] },
          ],
        }),
      });

      (db.whatsappTemplate.upsert as any).mockResolvedValue({});
      (db.whatsappTemplate.findMany as any).mockResolvedValue([
        { id: "tpl_1", name: "order_update", category: "UTILITY", language: "en_US", status: "APPROVED" },
      ]);

      const res = await syncWhatsappTemplates();

      expect(res.success).toBe(true);
      expect(db.whatsappTemplate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: "order_update",
            category: "UTILITY",
          }),
        })
      );
    });

    it("should list templates for active organization", async () => {
      const mockTemplates = [{ id: "tpl_1", name: "order_update" }];
      (db.whatsappTemplate.findMany as any).mockResolvedValue(mockTemplates);

      const res = await getWhatsappTemplates();

      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockTemplates);
    });
  });
});
