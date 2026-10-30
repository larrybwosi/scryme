import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  db: {
    integrationDefinition: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    globalSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
  IntegrationCategory: {
    COMMUNICATION: "COMMUNICATION",
    OTHER: "OTHER",
    MONITORING: "MONITORING",
  },
  AuthType: {
    API_KEY: "API_KEY",
    WEBHOOK_SECRET: "WEBHOOK_SECRET",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
  requireSuperAdmin: vi.fn().mockResolvedValue({ id: "admin_1" }),
}));

import { db } from "@repo/db";
import {
  listIntegrationDefinitions,
  updateSystemIntegrationSettings,
} from "../integrations";

describe("Admin Integrations Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listIntegrationDefinitions", () => {
    it("should seed missing default integrations concurrently via Promise.all", async () => {
      (db.integrationDefinition.findMany as any).mockResolvedValue([
        { name: "Scryme Chat", slug: "scryme-chat" },
      ]);
      (db.integrationDefinition.create as any).mockImplementation((args: any) =>
        Promise.resolve({ id: `def_${args.data.slug}`, ...args.data }),
      );

      const result = await listIntegrationDefinitions();

      expect(db.integrationDefinition.findMany).toHaveBeenCalledTimes(1);
      // 5 default integrations were missing (out of 6 total)
      expect(db.integrationDefinition.create).toHaveBeenCalledTimes(5);
      expect(result.length).toBe(6);
    });
  });

  describe("updateSystemIntegrationSettings", () => {
    it("should upsert all defined integration settings concurrently via Promise.all", async () => {
      (db.globalSetting.upsert as any).mockResolvedValue({ id: "setting_1" });

      const input = {
        scrymeChatClientId: "scryme-client-id-123",
        hermesApiKey: "hermes-key-456",
        resendApiKey: "resend-key-789",
        hermesEnabled: true,
      };

      const result = await updateSystemIntegrationSettings(input);

      expect(result).toEqual({ success: true });
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "system:integration:scryme:clientId" },
        update: { value: "scryme-client-id-123" },
        create: { key: "system:integration:scryme:clientId", value: "scryme-client-id-123" },
      });
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "system:integration:hermes:apiKey" },
        update: { value: "hermes-key-456" },
        create: { key: "system:integration:hermes:apiKey", value: "hermes-key-456" },
      });
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "system:integration:resend:apiKey" },
        update: { value: "resend-key-789" },
        create: { key: "system:integration:resend:apiKey", value: "resend-key-789" },
      });
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "system:integration:hermes:enabled" },
        update: { value: "true" },
        create: { key: "system:integration:hermes:enabled", value: "true" },
      });
    });
  });
});
