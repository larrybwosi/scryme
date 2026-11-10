import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpClient } from "../http";
import { CircuitBreaker } from "../circuit-breaker";
import { MemoryCache } from "../cache";
import {
  sanitizeSensitiveData,
  sanitizeHeaderValue,
  validateUrlSecurity,
  generateUuidV4,
} from "../security";
import { CircuitBreakerError, SecurityError } from "../errors";
import { createClientSDK } from "../client";
import { createServerSDK } from "../server";

describe("Industry Standard Security & Performance Enhancements", () => {
  describe("Sensitive Data Masking and Sanitization", () => {
    it("should mask sensitive headers and object keys", () => {
      const payload = {
        name: "Acme",
        password: "super-secret-password-123",
        token: "jwt-token-very-long-string-456",
        auth: {
          clientSecret: "sk_live_9999999999",
          apiKey: "key_live_12345",
        },
        items: [
          { sku: "SKU-1", creditCard: "1234-5678-9012-3456" }
        ],
      };

      const sanitized = sanitizeSensitiveData(payload);

      expect(sanitized.name).toBe("Acme");
      expect(sanitized.password).not.toBe("super-secret-password-123");
      expect(sanitized.password).toMatch(/^sup\.\.\.123$|^\[REDACTED\]$/);
      expect(sanitized.auth.clientSecret).toMatch(/^sk_\.\.\.999$|^\[REDACTED\]$/);
      expect(sanitized.auth.apiKey).toMatch(/^key\.\.\.345$|^\[REDACTED\]$/);
      expect(sanitized.items[0].sku).toBe("SKU-1");
      expect(sanitized.items[0].creditCard).not.toBe("1234-5678-9012-3456");
    });

    it("should handle circular references safely without stack overflow", () => {
      const circularObj: any = { name: "Safe" };
      circularObj.self = circularObj;

      const sanitized = sanitizeSensitiveData(circularObj);
      expect(sanitized.name).toBe("Safe");
      expect(sanitized.self).toBe("[CIRCULAR]");
    });

    it("should sanitize header values to prevent CRLF injection", () => {
      const dirtyHeader = "Bearer abc\r\nInjected-Header: evil\nAnother: bad";
      const clean = sanitizeHeaderValue(dirtyHeader);
      expect(clean).not.toContain("\r");
      expect(clean).not.toContain("\n");
      expect(clean).toBe("Bearer abc Injected-Header: evil Another: bad");
    });
  });

  describe("URL Security & Transport Validation", () => {
    it("should reject insecure http for remote domains unless explicitly allowed", () => {
      expect(() => {
        validateUrlSecurity("http://api.scryme.tech/v3");
      }).toThrow(/Insecure HTTP connection rejected/);
    });

    it("should permit http for localhost and loopback interfaces", () => {
      expect(() => {
        validateUrlSecurity("http://localhost:3002/v3");
        validateUrlSecurity("http://127.0.0.1:3002/v3");
        validateUrlSecurity("http://[::1]:3002/v3");
      }).not.toThrow();
    });

    it("should permit http for remote domains if allowInsecureHttp is set to true", () => {
      expect(() => {
        validateUrlSecurity("http://dev-internal-api.lan/v3", true);
      }).not.toThrow();
    });
  });

  describe("Circuit Breaker Resilience", () => {
    it("should trip open after reaching failure threshold and fast-fail subsequent requests", () => {
      const breaker = new CircuitBreaker({
        enabled: true,
        failureThreshold: 3,
        resetTimeoutMs: 5000,
      });

      expect(breaker.getState()).toBe("CLOSED");

      // Record 2 failures - still closed
      breaker.recordFailure(true);
      breaker.recordFailure(true);
      expect(breaker.getState()).toBe("CLOSED");

      // Record 3rd failure - trips to OPEN
      breaker.recordFailure(true);
      expect(breaker.getState()).toBe("OPEN");

      // Next checkHealth should immediately throw CircuitBreakerError
      expect(() => breaker.checkHealth()).toThrow(CircuitBreakerError);
    });

    it("should transition to HALF_OPEN after resetTimeoutMs and recover upon success", () => {
      const breaker = new CircuitBreaker({
        enabled: true,
        failureThreshold: 2,
        resetTimeoutMs: 100,
      });

      breaker.recordFailure(true);
      breaker.recordFailure(true);
      expect(breaker.getState()).toBe("OPEN");

      // Simulate passage of time
      vi.spyOn(Date, "now").mockReturnValue(Date.now() + 150);

      expect(breaker.getState()).toBe("HALF_OPEN");

      // Probe succeeds
      breaker.recordSuccess();
      expect(breaker.getState()).toBe("CLOSED");
    });
  });

  describe("In-Memory TTL & LRU Caching", () => {
    it("should cache responses and return on subsequent calls within TTL", () => {
      const cache = new MemoryCache({
        enabled: true,
        ttlMs: 500,
        maxEntries: 2,
      });

      cache.set("GET:/catalog/products", { items: [1, 2] });
      expect(cache.get("GET:/catalog/products")).toEqual({ items: [1, 2] });

      // Expire cache
      vi.spyOn(Date, "now").mockReturnValue(Date.now() + 600);
      expect(cache.get("GET:/catalog/products")).toBeUndefined();
    });

    it("should respect maxEntries and evict LRU items", () => {
      const cache = new MemoryCache({
        enabled: true,
        maxEntries: 2,
      });

      cache.set("k1", "v1");
      cache.set("k2", "v2");
      // Access k1 to make k2 oldest
      cache.get("k1");

      // Adding k3 should evict k2
      cache.set("k3", "v3");

      expect(cache.get("k1")).toBe("v1");
      expect(cache.get("k2")).toBeUndefined();
      expect(cache.get("k3")).toBe("v3");
    });
  });

  describe("Automatic Idempotency Key & Telemetry Headers", () => {
    it("should generate cryptographically valid UUID v4", () => {
      const uuid = generateUuidV4();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("should automatically inject Idempotency-Key on POST requests if not specified", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: "Created",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "order_1" }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
      });

      await client.post("/orders", { amount: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.scryme.tech/orders",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Idempotency-Key": expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
            "X-Client-Info": expect.stringContaining("@scryme/sdk/"),
          }),
        })
      );
    });

    it("should preserve explicitly supplied Idempotency-Key", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: "Created",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "order_1" }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
      });

      await client.post("/orders", { amount: 50 }, { idempotencyKey: "my-custom-key-123" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.scryme.tech/orders",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": "my-custom-key-123",
          }),
        })
      );
    });
  });

  describe("HttpClient Integration with Cache and Circuit Breaker", () => {
    it("should serve GET requests from cache without calling fetchFn", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "fresh" }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
        cache: { enabled: true, ttlMs: 10000 },
      });

      const res1 = await client.get("/settings");
      expect(res1.data).toEqual({ data: "fresh" });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should hit in-memory cache
      const res2 = await client.get("/settings");
      expect(res2.data).toEqual({ data: "fresh" });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Per-request skipCache bypasses cache
      const res3 = await client.get("/settings", { skipCache: true });
      expect(res3.data).toEqual({ data: "fresh" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should trip circuit breaker when downstream server throws 500s", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Downstream failure" }),
      });

      const client = new HttpClient({
        baseUrl: "https://api.scryme.tech",
        fetch: mockFetch as any,
        retry: { maxRetries: 0 },
        circuitBreaker: { enabled: true, failureThreshold: 2 },
      });

      await expect(client.get("/fail")).rejects.toThrow();
      await expect(client.get("/fail")).rejects.toThrow();

      // Third request fails fast at circuit breaker without calling fetchFn
      await expect(client.get("/fail")).rejects.toBeInstanceOf(CircuitBreakerError);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Client & Server SDK Options Passthrough", () => {
    it("should instantiate ScrymeClientSDK and ScrymeServerSDK with caching and circuit breaker options", () => {
      const client = createClientSDK({
        orgSlug: "test-org",
        cache: { enabled: true, ttlMs: 5000 },
        circuitBreaker: { enabled: true, failureThreshold: 3 },
      });

      expect(client.httpClient.cache.enabled).toBe(true);
      expect(client.httpClient.circuitBreaker.enabled).toBe(true);

      const server = createServerSDK({
        orgSlug: "test-org",
        cache: { enabled: true },
        circuitBreaker: { enabled: true },
      });

      expect(server.httpClient.cache.enabled).toBe(true);
      expect(server.httpClient.circuitBreaker.enabled).toBe(true);
    });
  });
});
