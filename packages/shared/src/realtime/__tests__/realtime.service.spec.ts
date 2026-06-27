import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RealtimeService } from "../realtime.service";
import { AblyRealtimeProvider } from "../ably.provider";
import { SocketIORealtimeProvider } from "../socketio.provider";

vi.mock("../ably.provider", () => {
  return {
    AblyRealtimeProvider: vi.fn().mockImplementation(() => ({
      publish: vi.fn(),
      getPresence: vi.fn(),
      enterPresence: vi.fn(),
      leavePresence: vi.fn(),
      getHistory: vi.fn(),
    })),
  };
});

vi.mock("../socketio.provider", () => {
  return {
    SocketIORealtimeProvider: vi.fn().mockImplementation(() => ({
      publish: vi.fn(),
      getPresence: vi.fn(),
      enterPresence: vi.fn(),
      leavePresence: vi.fn(),
      getHistory: vi.fn(),
    })),
  };
});

describe("RealtimeService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should initialize with AblyRealtimeProvider by default", () => {
    delete process.env.REALTIME_PROVIDER;
    const service = new RealtimeService();
    expect(AblyRealtimeProvider).toHaveBeenCalled();
  });

  it("should initialize with SocketIORealtimeProvider when REALTIME_PROVIDER is socketio", () => {
    process.env.REALTIME_PROVIDER = "socketio";
    const service = new RealtimeService();
    expect(SocketIORealtimeProvider).toHaveBeenCalled();
  });

  it("should delegate publish to the provider", async () => {
    process.env.REALTIME_PROVIDER = "socketio";
    const service = new RealtimeService();
    const provider = (service as any).provider;

    await service.publish("test-channel", "test-event", { foo: "bar" });
    expect(provider.publish).toHaveBeenCalledWith(
      "test-channel",
      "test-event",
      { foo: "bar" },
    );
  });

  it("should delegate presence methods to the provider", async () => {
    process.env.REALTIME_PROVIDER = "ably";
    const service = new RealtimeService();
    const provider = (service as any).provider;

    await service.enterPresence("chan", "client1", { name: "Jules" });
    expect(provider.enterPresence).toHaveBeenCalledWith("chan", "client1", {
      name: "Jules",
    });

    await service.getPresence("chan");
    expect(provider.getPresence).toHaveBeenCalledWith("chan");

    await service.leavePresence("chan", "client1");
    expect(provider.leavePresence).toHaveBeenCalledWith("chan", "client1");
  });

  it("should delegate getHistory to the provider", async () => {
    const service = new RealtimeService();
    const provider = (service as any).provider;

    await service.getHistory("chan", 50);
    expect(provider.getHistory).toHaveBeenCalledWith("chan", 50);
  });
});
