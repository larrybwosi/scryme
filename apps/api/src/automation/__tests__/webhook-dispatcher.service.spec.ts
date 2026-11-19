import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";
import * as crypto from "crypto";
import axios from "axios";

vi.mock("axios", () => {
  const mockAxios: any = {
    request: vi.fn(),
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
    vi.clearAllMocks();

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
    (axios.request as any).mockResolvedValue({
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
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/webhook",
        method: "POST",
        headers: expect.objectContaining({
          "X-Workflow-Signature": expect.stringMatching(/^sha256=/),
        }),
      }),
    );
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "WEBHOOK_DISPATCHED",
          level: "INFO",
        }),
      }),
    );
  });

  it("should honour the requested method, headers, timeout, and idempotency key", async () => {
    (axios.request as any).mockResolvedValue({
      status: 204,
      statusText: "No Content",
      data: null,
    });

    await service.dispatchOutgoingWebhook({
      organizationId: "org_1",
      endpointUrl: "https://example.com/resources/1",
      method: "patch",
      headers: { "X-Custom": "value" },
      payload: { name: "updated" },
      timeoutMs: 2500,
      idempotencyKey: "exec_1:node_2",
    });

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/resources/1",
        method: "PATCH",
        timeout: 2500,
        headers: expect.objectContaining({
          "X-Custom": "value",
          "Idempotency-Key": "exec_1:node_2",
          "X-Workflow-Delivery": "exec_1:node_2",
        }),
      }),
    );
  });

  it("should send GET payloads as query parameters instead of a request body", async () => {
    (axios.request as any).mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: { ok: true },
    });

    await service.dispatchOutgoingWebhook({
      organizationId: "org_1",
      endpointUrl: "https://example.com/search",
      method: "GET",
      payload: { query: "order 42" },
    });

    const request = (axios.request as any).mock.calls[0][0];
    expect(request.method).toBe("GET");
    expect(request.params).toEqual({ query: "order 42" });
    expect(request.data).toBeUndefined();
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
