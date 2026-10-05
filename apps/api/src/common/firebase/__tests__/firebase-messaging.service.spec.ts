import { describe, it, expect, beforeEach, vi } from "vitest";
import { FirebaseMessagingService } from "../firebase-messaging.service";

describe("FirebaseMessagingService", () => {
  let service: FirebaseMessagingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        deviceRegistry: {
          findMany: vi.fn(),
        },
      },
    };
    service = new FirebaseMessagingService(mockPrisma);
  });

  it("should initialize gracefully without credentials and mark isInitialized as false", () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    service.onModuleInit();

    expect(service.isInitialized()).toBe(false);
  });

  it("should return zero counts gracefully when calling sendToTokens when uninitialized", async () => {
    const result = await service.sendToTokens(["token1", "token2"], {
      title: "Test",
      body: "Test body",
    });

    expect(result).toEqual({ successCount: 0, failureCount: 0 });
  });

  it("should query devices and handle sendToMembers when uninitialized", async () => {
    mockPrisma.client.deviceRegistry.findMany.mockResolvedValue([
      { metadata: { pushToken: "token_123", registeredByMemberId: "mem_1" } },
    ]);

    const result = await service.sendToMembers("mem_1", {
      title: "Shift Update",
      body: "Your shift has been assigned",
    });

    expect(mockPrisma.client.deviceRegistry.findMany).toHaveBeenCalled();
    expect(result).toEqual({ successCount: 0, failureCount: 0 });
  });
});
