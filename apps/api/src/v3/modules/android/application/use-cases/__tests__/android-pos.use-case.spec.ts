import { describe, it, expect, beforeEach, vi } from "vitest";
import { AndroidPosUseCase } from "../android-pos.use-case";

describe("AndroidPosUseCase", () => {
  let useCase: AndroidPosUseCase;
  let mockPrisma: any;
  let mockAndroidAuthUseCase: any;
  let mockAndroidUseCase: any;
  let mockPosPairingService: any;
  let mockRealtimeService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        inventoryLocation: {
          findFirst: vi.fn(),
        },
      },
    };
    mockAndroidAuthUseCase = {
      loginMember: vi.fn(),
      exchangeToken: vi.fn(),
    };
    mockAndroidUseCase = {
      registerDevice: vi.fn().mockResolvedValue({ id: "device-1", deviceName: "Android POS Terminal" }),
    };
    mockPosPairingService = {
      findSession: vi.fn(),
      getSession: vi.fn(),
      authorizeSession: vi.fn(),
    };
    mockRealtimeService = {
      publish: vi.fn().mockResolvedValue(true),
    };

    useCase = new AndroidPosUseCase(
      mockPrisma,
      mockAndroidAuthUseCase,
      mockAndroidUseCase,
      mockPosPairingService,
      mockRealtimeService,
    );
  });

  it("should authorize pairing session and emit socket events if session exists in PosPairingService", async () => {
    const v3Context = {
      organizationId: "org-1",
      memberId: "mem-1",
      orgSlug: "acme",
    };
    const dto = {
      sessionId: "pair_abc123",
      pairingCode: "654321",
      locationId: "loc-branch-1",
    };

    mockPosPairingService.findSession.mockReturnValue({
      sessionId: "pair_abc123",
      pairingCode: "654321",
      status: "PENDING",
    });
    mockPosPairingService.getSession.mockReturnValue({
      sessionId: "pair_abc123",
      pairingCode: "654321",
      status: "AUTHORIZED",
    });
    mockPosPairingService.authorizeSession.mockResolvedValue({
      deviceKey: "dev-key-123",
      apiKey: "api-key-123",
    });

    const result = await useCase.authorizePosPairingSession(v3Context, "pair_abc123", dto);

    expect(result.success).toBe(true);
    expect(result.authorized).toBe(true);
    expect(mockPosPairingService.authorizeSession).toHaveBeenCalledWith(
      "pair_abc123",
      "org-1",
      "mem-1",
      mockPrisma,
      {
        locationId: "loc-branch-1",
        deviceName: undefined,
        deviceType: undefined,
      }
    );
    expect(mockRealtimeService.publish).toHaveBeenCalledWith(
      "pos:pairing:pair_abc123",
      "pairing:authorized",
      expect.objectContaining({ sessionId: "pair_abc123", status: "AUTHORIZED" })
    );
    expect(mockRealtimeService.publish).toHaveBeenCalledWith(
      "v3:pos:pairing:654321",
      "pairing:authorized",
      expect.objectContaining({ pairingCode: "654321" })
    );
    expect(mockAndroidUseCase.registerDevice).toHaveBeenCalled();
  });

  it("should register device even if session is not active in pos pairing memory", async () => {
    const v3Context = {
      organizationId: "org-1",
      memberId: "mem-1",
    };
    const dto = {
      pairingCode: "123456",
    };

    mockPosPairingService.findSession.mockReturnValue(null);

    const result = await useCase.authorizePosPairingSession(v3Context, "123456", dto);

    expect(result.success).toBe(true);
    expect(result.device).toBeDefined();
    expect(mockPosPairingService.authorizeSession).not.toHaveBeenCalled();
    expect(mockAndroidUseCase.registerDevice).toHaveBeenCalled();
  });
});
