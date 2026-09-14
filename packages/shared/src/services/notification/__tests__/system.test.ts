import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendSystemNotification, notifySystemAdminsOfError } from "../system";

// Create mocks prefixed with "mock" so they are accessible inside the hoisted vi.mock factory
const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
const mockConstructor = vi.fn();

// Mock the Scryme module
vi.mock("@repo/chat", () => {
  return {
    ScrymeChatApiClient: class {
      constructor(baseUrl: string, clientId: string, clientSecret: string) {
        mockConstructor(baseUrl, clientId, clientSecret);
      }
      sendMessage = mockSendMessage;
    },
  };
});

// Mock database
vi.mock("@repo/db", () => {
  return {
    db: {
      globalSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: "system:error:alerts:enabled", value: "true" },
          { key: "system:error:alerts:minStatus", value: "500" },
          { key: "system:admin:chat:workspaceSlug", value: "system-admins" },
          { key: "system:admin:chat:channelSlug", value: "system-alerts" },
        ]),
      },
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

describe("notifySystemAdminsOfError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should format and send error details to Scryme Chat when status >= minStatus", async () => {
    await notifySystemAdminsOfError({
      status: 500,
      message: "Database connection failed",
      code: "DB_CONN_ERROR",
      method: "GET",
      path: "/api/v3/orders",
      correlationId: "corr-123",
      organizationId: "org-456",
    });

    expect(mockSendMessage).toHaveBeenCalledWith(
      "system-admins",
      "system-alerts",
      expect.objectContaining({
        content: expect.stringContaining("🚨 **System Exception Alert** [HTTP 500]"),
      })
    );

    const callArg = mockSendMessage.mock.calls[0][2].content;
    expect(callArg).toContain("`GET /api/v3/orders`");
    expect(callArg).toContain("Database connection failed");
    expect(callArg).toContain("`corr-123`");
  });

  it("should skip sending error alert if status < minStatus", async () => {
    await notifySystemAdminsOfError({
      status: 400,
      message: "Bad request payload",
      code: "BAD_REQUEST",
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
