import { Test, TestingModule } from "@nestjs/testing";
import { WebhookProcessor } from "../webhook.processor";
import { WebhookService } from "../../services/webhook.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("WebhookProcessor", () => {
  let processor: WebhookProcessor;
  let webhookServiceMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    webhookServiceMock = {
      createLog: vi.fn().mockResolvedValue({ id: "log-1" }),
      updateLog: vi.fn().mockResolvedValue({ id: "log-1" }),
      generateSignature: vi.fn().mockReturnValue("mock_hmac_signature"),
    };
    prismaMock = {
      client: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookProcessor,
        { provide: WebhookService, useValue: webhookServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    processor = module.get<WebhookProcessor>(WebhookProcessor);
    vi.clearAllMocks();
  });

  it("should process delivery job successfully and update webhook log", async () => {
    const mockJob: any = {
      name: "deliver",
      attemptsMade: 0,
      opts: { attempts: 3 },
      data: {
        subscriptionId: "sub-1",
        event: "order.created",
        payload: { id: "ord-1" },
        url: "https://example.com/webhook-listener",
        secret: "whsec_test",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("OK"),
    } as any);

    await processor.process(mockJob);

    expect(webhookServiceMock.createLog).toHaveBeenCalledWith(
      "sub-1",
      "order.created",
      { id: "ord-1" },
    );
    expect(webhookServiceMock.generateSignature).toHaveBeenCalledWith(
      { id: "ord-1" },
      "whsec_test",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/webhook-listener",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Dealio-Event": "order.created",
          "X-Dealio-Signature": "mock_hmac_signature",
          "X-Hub-Signature-256": "sha256=mock_hmac_signature",
        }),
      }),
    );
    expect(webhookServiceMock.updateLog).toHaveBeenCalledWith("log-1", {
      responseStatus: 200,
      responseBody: "OK",
      status: "SUCCESS",
      attemptCount: 1,
    });
  });

  it("should block SSRF URLs and log failure", async () => {
    const mockJob: any = {
      name: "deliver",
      attemptsMade: 0,
      opts: { attempts: 3 },
      data: {
        subscriptionId: "sub-1",
        event: "order.created",
        payload: { id: "ord-1" },
        url: "http://127.0.0.1:8080/internal",
        secret: "whsec_test",
      },
    };

    await expect(processor.process(mockJob)).rejects.toThrow(
      "Insecure webhook URL blocked",
    );
    expect(webhookServiceMock.createLog).toHaveBeenCalled();
    expect(webhookServiceMock.updateLog).toHaveBeenCalledWith("log-1", {
      error: "Insecure webhook URL blocked (SSRF protection)",
      status: "FAILED",
    });
  });
});
