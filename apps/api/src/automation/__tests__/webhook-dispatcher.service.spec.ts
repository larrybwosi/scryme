import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";
import * as crypto from "crypto";
import axios from "axios";

vi.mock("axios", () => {
  const mockAxios: any = {
    post: vi.fn(),
    create: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  mockAxios.create.mockReturnValue(mockAxios);
  return {
    default: mockAxios,
  };
});

describe("WebhookDispatcherService", () => {
  let service: WebhookDispatcherService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        workflowEngineAuditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit_1" }),
        },
      },
    };

    service = new WebhookDispatcherService(mockPrisma as any);
  });

  it("should correctly verify valid HMAC SHA-256 incoming signatures", () => {
    const secret = "my_webhook_secret";
    const payload = JSON.stringify({ event: "order.created", id: "ord_100" });
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const isValid = service.verifyIncomingSignature(secret, payload, `sha256=${signature}`);
    expect(isValid).toBe(true);
  });

  it("should reject invalid incoming signatures", () => {
    const secret = "my_webhook_secret";
    const payload = JSON.stringify({ event: "order.created", id: "ord_100" });

    const isValid = service.verifyIncomingSignature(secret, payload, "sha256=invalid_signature");
    expect(isValid).toBe(false);
  });

  it("should dispatch outgoing webhook with HMAC signature header and log audit entry", async () => {
    (axios.post as any).mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: { received: true },
    });

    const result = await service.dispatchOutgoingWebhook({
      organizationId: "org_1",
      executionId: "exec_1",
      jobId: "job_1",
      endpointUrl: "https://example.com/webhook",
      secret: "secret_123",
      payload: { data: "test" },
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(axios.post).toHaveBeenCalled();
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "WEBHOOK_DISPATCHED",
          level: "INFO",
        }),
      }),
    );
  });

  it("should block dispatch and log audit error when endpointUrl fails SSRF validation", async () => {
    await expect(
      service.dispatchOutgoingWebhook({
        organizationId: "org_1",
        executionId: "exec_1",
        jobId: "job_1",
        endpointUrl: "http://127.0.0.1:3000/internal",
        payload: { data: "test" },
      }),
    ).rejects.toThrow("SSRF security validation");

    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "WEBHOOK_DISPATCH_BLOCKED",
          level: "ERROR",
        }),
      }),
    );
  });
});
