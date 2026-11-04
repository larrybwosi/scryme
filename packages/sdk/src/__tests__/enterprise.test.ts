import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpClient } from "../http";
import {
  ScrymeError,
  ScrymeApiError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  NetworkError,
  TimeoutError,
  createApiErrorFromResponse,
} from "../errors";
import { calculateRetryDelay, DEFAULT_RETRY_OPTIONS } from "../retry";
import { autoPaging, autoPagingToArray } from "../pagination";
import { verifyWebhookSignature, computeHmacSha256 } from "../webhooks";
import { ScrymeClientSDK, createClientSDK } from "../client";
import { ScrymeServerSDK, createServerSDK } from "../server";

describe("Enterprise SDK Capabilities", () => {
  describe("Typed Error Hierarchy", () => {
    it("should create ScrymeApiError subclasses correctly based on HTTP status", () => {
      const err401 = createApiErrorFromResponse(401, { message: "Invalid credentials" });
      expect(err401).toBeInstanceOf(AuthenticationError);
      expect(err401.status).toBe(401);
      expect(err401.message).toBe("Invalid credentials");

      const err404 = createApiErrorFromResponse(404, { message: "Resource not found" });
      expect(err404).toBeInstanceOf(NotFoundError);
      expect(err404.status).toBe(404);

      const err409 = createApiErrorFromResponse(409, { error: "Resource conflict" });
      expect(err409).toBeInstanceOf(ConflictError);
      expect(err409.status).toBe(409);

      const headers = new Headers();
      headers.set("retry-after", "12");
      headers.set("x-request-id", "req-test-123");
      const err429 = createApiErrorFromResponse(429, { message: "Too many requests" }, headers);
      expect(err429).toBeInstanceOf(RateLimitError);
      expect((err429 as RateLimitError).retryAfter).toBe(12);
      expect(err429.requestId).toBe("req-test-123");

      const err500 = createApiErrorFromResponse(500, { message: "Internal server crash" });
      expect(err500).toBeInstanceOf(InternalServerError);
      expect(err500.status).toBe(500);
    });

    it("should handle array of validation error messages", () => {
      const err = createApiErrorFromResponse(400, {
        message: ["name must be a string", "email must be valid"],
      });
      expect(err).toBeInstanceOf(ScrymeApiError);
      expect(err.message).toBe("name must be a string; email must be valid");
    });
  });

  describe("Enterprise Retry with Jitter", () => {
    it("should calculate capped backoff delay within maxDelayMs", () => {
      const delay = calculateRetryDelay(5, DEFAULT_RETRY_OPTIONS);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_OPTIONS.maxDelayMs);
    });

    it("should respect retry-after header if provided", () => {
      const delay = calculateRetryDelay(1, DEFAULT_RETRY_OPTIONS, 2);
      expect(delay).toBe(2000);
    });
  });

  describe("Auto-Pagination Async Iterator", () => {
    it("should iterate pages seamlessly using autoPaging", async () => {
      const mockPages = [
        { data: [{ id: 1 }, { id: 2 }], meta: { page: 1, totalPages: 2 } },
        { data: [{ id: 3 }], meta: { page: 2, totalPages: 2 } },
      ];

      const fetcher = vi.fn().mockImplementation(async ({ page }) => {
        return mockPages[page - 1] || { data: [] };
      });

      const items: any[] = [];
      for await (const item of autoPaging(fetcher, { limit: 2 })) {
        items.push(item);
      }

      expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("should collect all items to an array using autoPagingToArray", async () => {
      const fetcher = vi.fn().mockImplementation(async ({ page }) => {
        if (page === 1) return { data: ["a", "b"] };
        if (page === 2) return { data: ["c"] };
        return { data: [] };
      });

      const all = await autoPagingToArray(fetcher, { limit: 2 });
      expect(all).toEqual(["a", "b", "c"]);
    });

    it("should stop immediately if maxItems is reached", async () => {
      const fetcher = vi.fn().mockResolvedValue({
        data: [1, 2, 3, 4, 5],
      });

      const items = await autoPagingToArray(fetcher, { maxItems: 3 });
      expect(items).toEqual([1, 2, 3]);
    });
  });

  describe("Timing-Safe Webhook Signature Verification", () => {
    it("should successfully verify a valid HMAC-SHA256 signature", async () => {
      const secret = "whsec_enterprise_secret_123";
      const payload = JSON.stringify({ event: "order.created", id: "ord_100" });
      const signature = await computeHmacSha256(payload, secret);

      const isValid = await verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject tampered payload", async () => {
      const secret = "whsec_enterprise_secret_123";
      const payload = JSON.stringify({ event: "order.created", id: "ord_100" });
      const signature = await computeHmacSha256(payload, secret);

      await expect(
        verifyWebhookSignature(payload + "tampered", signature, secret)
      ).rejects.toThrow("Webhook signature mismatch");
    });

    it("should verify timestamped headers t=...,v1=...", async () => {
      const secret = "whsec_enterprise_secret_123";
      const payload = JSON.stringify({ event: "payment.received" });
      const now = Math.floor(Date.now() / 1000);
      const signature = await computeHmacSha256(`${now}.${payload}`, secret);
      const header = `t=${now},v1=${signature}`;

      const isValid = await verifyWebhookSignature(payload, header, secret, 300);
      expect(isValid).toBe(true);
    });

    it("should reject expired webhook timestamp", async () => {
      const secret = "whsec_enterprise_secret_123";
      const payload = JSON.stringify({ event: "payment.received" });
      const expiredTime = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const signature = await computeHmacSha256(`${expiredTime}.${payload}`, secret);
      const header = `t=${expiredTime},v1=${signature}`;

      await expect(
        verifyWebhookSignature(payload, header, secret, 300)
      ).rejects.toThrow("Webhook timestamp expired");
    });
  });

  describe("Universal Fetch HttpClient", () => {
    it("should execute requests with custom fetch injection", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: [1, 2, 3] }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
      });

      const res = await client.get("/v3/test");
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true, data: [1, 2, 3] });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.scryme.tech/v3/test",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should inject Idempotency-Key on mutating requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: "Created",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "trans_1" }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
      });

      await client.post("/v3/payments", { amount: 100 }, { idempotencyKey: "idem-key-999" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.scryme.tech/v3/payments",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": "idem-key-999",
          }),
        })
      );
    });

    it("should invoke lifecycle hooks onRequest and onResponse", async () => {
      const onRequest = vi.fn();
      const onResponse = vi.fn();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ ok: true }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
        onRequest,
        onResponse,
      });

      await client.get("/ping");
      expect(onRequest).toHaveBeenCalled();
      expect(onResponse).toHaveBeenCalled();
    });

    it("should retry transient 500 errors and succeed on second attempt", async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ message: "Temporary failure" }),
          };
        }
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        };
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
        retry: {
          maxRetries: 2,
          initialDelayMs: 10,
        },
      });

      const res = await client.get("/transient");
      expect(res.status).toBe(200);
      expect(callCount).toBe(2);
    });
  });

  describe("Client & Server SDK Instantiation with Fetch Transport", () => {
    it("should instantiate ScrymeClientSDK and ScrymeServerSDK seamlessly", () => {
      const clientSDK = createClientSDK({
        orgSlug: "enterprise-org",
        clientId: "client-123",
      });

      expect(clientSDK.cart).toBeDefined();
      expect(clientSDK.catalog).toBeDefined();
      expect(clientSDK.customer).toBeDefined();

      const serverSDK = createServerSDK({
        orgSlug: "enterprise-org",
        token: "jwt-test-token",
      });

      expect(serverSDK.cart).toBeDefined();
      expect(serverSDK.customer).toBeDefined();
      expect(serverSDK.token).toBe("jwt-test-token");
    });
  });
});
