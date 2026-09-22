import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicSentryWebhookController } from "../sentry-webhook.controller";
import { PrismaService } from "@/prisma/prisma.service";

describe("PublicSentryWebhookController", () => {
  let controller: PublicSentryWebhookController;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      client: {
        globalSetting: {
          findMany: vi.fn().mockResolvedValue([
            { key: "system:integration:sentry:enabled", value: "true" },
            { key: "system:admin:chat:workspaceSlug", value: "system-admins" },
            { key: "system:admin:chat:channelSlug", value: "system-alerts" },
          ]),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicSentryWebhookController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<PublicSentryWebhookController>(PublicSentryWebhookController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should handle Sentry webhook event payload", async () => {
    const mockReq = { rawBody: Buffer.from(JSON.stringify({})) };
    const mockBody = {
      action: "created",
      data: {
        issue: {
          title: "Unhandled TypeError",
          web_url: "https://sentry.io/issues/12345",
          culprit: "users.ts:167",
          level: "error",
          environment: "test",
        },
        project: { name: "Scryme Admin" },
      },
    };

    const result = await controller.receiveSentryWebhook(
      mockReq,
      "issue",
      "",
      mockBody,
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should return early if Sentry integration is disabled", async () => {
    mockPrismaService.client.globalSetting.findMany.mockResolvedValue([
      { key: "system:integration:sentry:enabled", value: "false" },
    ]);

    const result = await controller.receiveSentryWebhook(
      {},
      "issue",
      "",
      {},
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe("Sentry integration is disabled");
  });
});
