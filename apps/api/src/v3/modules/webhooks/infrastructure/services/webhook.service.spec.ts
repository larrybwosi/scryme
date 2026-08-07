import { Test, TestingModule } from "@nestjs/testing";
import { WebhookService } from "./webhook.service";
import { PrismaService } from "@/prisma/prisma.service";
import { getQueueToken } from "@nestjs/bullmq";
import { describe, it, expect, beforeEach, vi, type MockInstance } from "vitest";

describe("WebhookService", () => {
  let service: WebhookService;
  let prisma: PrismaService;
  let queueMock: any;

  const mockPrisma = {
    client: {
      webhookSubscription: {
        findMany: vi.fn(),
      },
    },
  };

  const mockQueue = {
    add: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken("webhooks"), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    prisma = module.get<PrismaService>(PrismaService);
    queueMock = mockQueue;
    vi.clearAllMocks();
  });

  it("should dispatch jobs in parallel using Promise.all", async () => {
    const subs = [
      { id: "sub-1", url: "https://a.com", secret: "sec-1" },
      { id: "sub-2", url: "https://b.com", secret: "sec-2" },
    ];
    vi.mocked(mockPrisma.client.webhookSubscription.findMany).mockResolvedValue(subs as any);

    await service.dispatch("test.event", "org-1", { foo: "bar" });

    expect(mockPrisma.client.webhookSubscription.findMany).toHaveBeenCalled();
    expect(queueMock.add).toHaveBeenCalledTimes(2);
  });
});
