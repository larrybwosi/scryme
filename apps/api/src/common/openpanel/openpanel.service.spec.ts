import { Test, TestingModule } from "@nestjs/testing";
import { OpenPanelService } from "./openpanel.service";

describe("OpenPanelService", () => {
  let service: OpenPanelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenPanelService],
    }).compile();

    service = module.get<OpenPanelService>(OpenPanelService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should handle onModuleInit gracefully when credentials are missing or placeholder", () => {
    expect(() => service.onModuleInit()).not.toThrow();
  });

  it("should handle track calls safely without throwing", async () => {
    await expect(
      service.track({ event: "test_event", profileId: "user_123", properties: { key: "value" } }),
    ).resolves.not.toThrow();
  });

  it("should handle trackEvent calls safely without throwing", async () => {
    await expect(
      service.trackEvent("test_event_2", "user_456", { score: 100 }),
    ).resolves.not.toThrow();
  });

  it("should handle identify calls safely without throwing", async () => {
    await expect(
      service.identify({ profileId: "user_123", email: "test@example.com" }),
    ).resolves.not.toThrow();
  });

  it("should handle alias calls safely without throwing", async () => {
    await expect(
      service.alias({ profileId: "user_123", alias: "alias_456" }),
    ).resolves.not.toThrow();
  });
});
