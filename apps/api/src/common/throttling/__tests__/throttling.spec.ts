import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedisThrottlerStorage } from "../redis-throttler-storage";
import { MultiTenantThrottlerGuard } from "../multi-tenant-throttler.guard";
import { ExecutionContext } from "@nestjs/common";

describe("Resilient Throttling and Multi-Tenancy Rate Limiting Tests", () => {
  describe("RedisThrottlerStorage", () => {
    let mockRedis: any;
    let storage: RedisThrottlerStorage;

    beforeEach(() => {
      mockRedis = {
        get: vi.fn(),
        setex: vi.fn(),
        incr: vi.fn(),
        expire: vi.fn(),
        ttl: vi.fn(),
        del: vi.fn(),
      };
      storage = new RedisThrottlerStorage(mockRedis);
    });

    it("should return blocked status if key is already blocked", async () => {
      mockRedis.get.mockResolvedValue("1");
      mockRedis.ttl.mockResolvedValue(123);

      const result = await storage.increment("test-key", 60000, 5, 10000, "default");

      expect(result).toEqual({
        totalHits: 5,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: 123,
      });
      expect(mockRedis.get).toHaveBeenCalledWith("throttler:default:test-key:blocked");
    });

    it("should increment and set TTL on first hit", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(60);

      const result = await storage.increment("test-key", 60000, 5, 10000, "default");

      expect(result).toEqual({
        totalHits: 1,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      });
      expect(mockRedis.incr).toHaveBeenCalledWith("throttler:default:test-key:hits");
      expect(mockRedis.expire).toHaveBeenCalledWith("throttler:default:test-key:hits", 60);
    });

    it("should block client if hit limit is exceeded", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(6); // Limit is 5
      mockRedis.ttl.mockResolvedValue(55);

      const result = await storage.increment("test-key", 60000, 5, 10000, "default");

      expect(result).toEqual({
        totalHits: 6,
        timeToExpire: 55,
        isBlocked: true,
        timeToBlockExpire: 10, // 10000 ms blockDuration = 10s
      });
      expect(mockRedis.setex).toHaveBeenCalledWith("throttler:default:test-key:blocked", 10, "1");
    });
  });

  describe("MultiTenantThrottlerGuard", () => {
    let guard: MultiTenantThrottlerGuard;
    let mockReflector: any;

    beforeEach(() => {
      mockReflector = {
        getAllAndOverride: vi.fn(),
        get: vi.fn(),
      };
      // We can mock options and storageService required by constructor
      const mockOptions = { throttlers: [] };
      const mockStorage = {} as any;
      guard = new MultiTenantThrottlerGuard(mockOptions, mockStorage, mockReflector);
    });

    it("should resolve tracker as tenant ID if v2Context organizationId exists", async () => {
      const mockReq = {
        v2Context: { organizationId: "org-v2" },
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe("tenant:org-v2");
    });

    it("should resolve tracker as tenant ID if v3Context organizationId exists", async () => {
      const mockReq = {
        v3Context: { organizationId: "org-v3" },
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe("tenant:org-v3");
    });

    it("should resolve tracker from req.organization.id if present", async () => {
      const mockReq = {
        organization: { id: "org-req" },
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe("tenant:org-req");
    });

    it("should high-performance decode organizationId from JWT Bearer token if not yet authenticated", async () => {
      // Base64 encoded payload: {"organizationId": "jwt-org-id"}
      const payloadBase64 = Buffer.from(JSON.stringify({ organizationId: "jwt-org-id" })).toString("base64");
      const fakeJwt = `header.${payloadBase64}.signature`;

      const mockReq = {
        headers: {
          authorization: `Bearer ${fakeJwt}`,
        },
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe("tenant:jwt-org-id");
    });

    it("should resolve tracker as device if x-api-key is present", async () => {
      const mockReq = {
        headers: {
          "x-api-key": "device-key-123",
        },
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe("device:device-key-123");
    });

    it("should fallback to IP address", async () => {
      const mockReq = {
        headers: {
          "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        },
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe("ip:1.2.3.4");
    });
  });
});
