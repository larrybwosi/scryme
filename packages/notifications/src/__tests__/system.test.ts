import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendSystemNotification } from "../system";

// Create mocks prefixed with "mock" so they are accessible inside the hoisted vi.mock factory
const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
const mockConstructor = vi.fn();

// Mock the Scryme module
vi.mock("@repo/scryme", () => {
  return {
    ScrymeChatApiClient: class {
      constructor(baseUrl: string, clientId: string, clientSecret: string) {
        mockConstructor(baseUrl, clientId, clientSecret);
      }
      sendMessage = mockSendMessage;
    },
  };
});

// Mock env
vi.mock("@repo/env", () => {
  return {
    env: {
      SCRYME_CHAT_CLIENT_ID: "env-client-id",
      SCRYME_CHAT_CLIENT_SECRET: "env-client-secret",
      SCRYME_SYSTEM_WORKSPACE_SLUG: "env-workspace-slug",
      SCRYME_SYSTEM_CHANNEL_SLUG: "env-channel-slug",
      SCRYME_CHAT_API_URL: "https://api.scryme.app",
    },
  };
});

describe("sendSystemNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send a system notification using the configured environment variables", async () => {
    await sendSystemNotification("Welcome to the system!");

    expect(mockConstructor).toHaveBeenCalledWith(
      "https://api.scryme.app",
      "env-client-id",
      "env-client-secret"
    );

    expect(mockSendMessage).toHaveBeenCalledWith(
      "env-workspace-slug",
      "env-channel-slug",
      { content: "Welcome to the system!" }
    );
  });

  it("should support custom channelSlug override", async () => {
    await sendSystemNotification("Critical alert!", { channelSlug: "alerts" });

    expect(mockSendMessage).toHaveBeenCalledWith(
      "env-workspace-slug",
      "alerts",
      { content: "Critical alert!" }
    );
  });

  it("should gracefully skip when client credentials or workspace are missing", async () => {
    // Temp mock console.warn
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Mock env to have missing config
    const originalEnv = await import("@repo/env");
    const mockEnv = originalEnv.env as any;
    mockEnv.SCRYME_CHAT_CLIENT_ID = "";

    await sendSystemNotification("Test missing config");

    expect(warnSpy).toHaveBeenCalledWith(
      "Scryme system notification skipped: SCRYME_CHAT_CLIENT_ID, SCRYME_CHAT_CLIENT_SECRET, or SCRYME_SYSTEM_WORKSPACE_SLUG is not configured."
    );

    // Restore env
    mockEnv.SCRYME_CHAT_CLIENT_ID = "env-client-id";
    warnSpy.mockRestore();
  });
});
