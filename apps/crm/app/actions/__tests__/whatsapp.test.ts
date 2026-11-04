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
  sendPaymentReceiptNotificationAction,
  sendDeliveryStatusNotificationAction,
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
          verifyToken: "custom_verify_token",
        },
        settings: {
          enableWelcomeReply: true,
          welcomeMessage: "Welcome to our shop!",
        },
        syncStatus: "CONNECTED",
      });

      const res = await getWhatsappConfig();

      expect(res.success).toBe(true);
      expect(res.data?.isConnected).toBe(true);
      expect(res.data?.credentials?.phoneNumberId).toBe("123456789");
      expect(res.data?.credentials?.verifyToken).toBe("custom_verify_token");
      expect(res.data?.settings?.enableWelcomeReply).toBe(true);
      expect(res.data?.webhookCallbackUrl).toContain("/webhooks/whatsapp");
      expect(res.data?.syncStatus).toBe("CONNECTED");
    });

    it("should return DISCONNECTED status when integration does not exist", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue(null);

      const res = await getWhatsappConfig();

      expect(res.success).toBe(true);
      expect(res.data?.isConnected).toBe(false);
      expect(res.data?.credentials).toBeNull();
      expect(res.data?.syncStatus).toBe("DISCONNECTED");
      expect(res.data?.verifyToken).toContain("scryme_wa_");
    });
  });

  describe("saveWhatsappConfig", () => {
    it("should return error if phone number ID or access token is missing", async () => {
      const res = await saveWhatsappConfig({ phoneNumberId: "", accessToken: "" });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Phone Number ID and Access Token are required.");
    });

    it("should upsert integration definition and organization integration with appSecret and autoreplies", async () => {
      (db.integrationDefinition.upsert as any).mockResolvedValue({ id: "def_whatsapp" });
      (db.organizationIntegration.upsert as any).mockResolvedValue({ id: "org_int_1" });

      const res = await saveWhatsappConfig({
        phoneNumberId: "123456",
        accessToken: "token_abc",
        appSecret: "meta_secret_xyz",
        verifyToken: "my_verify_tok",
        displayPhoneNumber: "+254700000000",
        enableWelcomeReply: true,
        welcomeMessage: "Hi there!",
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
            credentials: expect.objectContaining({
              appSecret: "meta_secret_xyz",
              verifyToken: "my_verify_tok",
            }),
            settings: expect.objectContaining({
              enableWelcomeReply: true,
              welcomeMessage: "Hi there!",
            }),
          }),
        })
      );
    });
  });

  describe("sendPaymentReceiptNotificationAction", () => {
    it("should dispatch payment receipt template message", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue({
        isActive: true,
        credentials: { phoneNumberId: "phone_1", accessToken: "token_1" },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "wamid.receipt.123" }] }),
      });
      (db.communicationThread.upsert as any).mockResolvedValue({ id: "thread_receipt" });
      (db.communicationMessage.create as any).mockResolvedValue({ id: "msg_receipt" });

      const res = await sendPaymentReceiptNotificationAction({
        recipientPhone: "+254711223344",
        transactionId: "TXN-9988",
        amount: 2500,
        currency: "KES",
        receiptUrl: "https://pay.scryme.tech/receipts/9988",
      });

      expect(res.success).toBe(true);
      expect(db.communicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: "OUTBOUND",
            metadata: expect.objectContaining({
              templateName: "payment_receipt",
            }),
          }),
        })
      );
    });
  });

  describe("sendDeliveryStatusNotificationAction", () => {
    it("should dispatch delivery status update template message", async () => {
      (db.organizationIntegration.findFirst as any).mockResolvedValue({
        isActive: true,
        credentials: { phoneNumberId: "phone_1", accessToken: "token_1" },
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "wamid.delivery.123" }] }),
      });
      (db.communicationThread.upsert as any).mockResolvedValue({ id: "thread_deliv" });
      (db.communicationMessage.create as any).mockResolvedValue({ id: "msg_deliv" });

      const res = await sendDeliveryStatusNotificationAction({
        recipientPhone: "+254711223344",
        trackingNumber: "TRK-7766",
        status: "OUT_FOR_DELIVERY",
        estimatedDate: "Today by 4 PM",
      });

      expect(res.success).toBe(true);
      expect(db.communicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: "OUTBOUND",
            metadata: expect.objectContaining({
              templateName: "delivery_status_update",
            }),
          }),
        })
      );
    });
  });
});
