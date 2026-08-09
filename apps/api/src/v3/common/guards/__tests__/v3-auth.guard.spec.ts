import { Test, TestingModule } from "@nestjs/testing";
import { V3AuthGuard } from "../v3-auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { Reflector } from "@nestjs/core";
import { V3AuthCoreService } from "../../../../v3/modules/auth-core/infrastructure/services/v3-auth-core.service";
import { RedisService } from "@/redis/redis.service";
import { AuthService } from "@/auth/auth.service";
import { UnauthorizedException, ExecutionContext } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyZitadelJwt } from "@repo/shared/api/v2";

vi.mock("@repo/shared/api/v2", () => ({
  verifyZitadelJwt: vi.fn(),
  decrypt: vi.fn(),
  timingSafeMatch: vi.fn(),
}));

describe("V3AuthGuard", () => {
  let guard: V3AuthGuard;
  let prisma: PrismaService;
  let reflector: Reflector;
  let v3AuthService: V3AuthCoreService;
  let redisService: RedisService;
  let authService: AuthService;

  beforeEach(() => {
    prisma = {
      client: {
        organization: {
          findUnique: vi.fn().mockResolvedValue({
            id: "org-1",
            slug: "org-slug",
            name: "Test Org",
          }),
        },
        customer: {
          findUnique: vi.fn(),
        },
        externalMapping: {
          findFirst: vi.fn(),
        },
      },
    } as any;

    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    } as any;

    v3AuthService = {
      verifyToken: vi.fn(),
    } as any;

    redisService = {
      get: vi.fn(),
    } as any;

    authService = {
      auth: {
        api: {
          getSession: vi.fn(),
        },
      },
    } as any;

    const moduleRef = {
      get: vi.fn((token) => {
        if (token === V3AuthCoreService) return v3AuthService;
        if (token === RedisService) return redisService;
        if (token === AuthService) return authService;
        return null;
      }),
    } as any;

    guard = new V3AuthGuard(prisma, moduleRef, reflector);
    vi.stubEnv("ZITADEL_DOMAIN", "test.zitadel.cloud");
    vi.stubEnv("ZITADEL_CLIENT_ID", "test-client-id");
    vi.clearAllMocks();
  });

  const createExecutionContext = (token: string, orgSlug: string): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${token}`,
            "x-org-slug": orgSlug,
          },
          params: {
            orgSlug,
          },
        }),
      }),
    } as any;
  };

  it("should allow public handlers to bypass guard completely", async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
    const context = createExecutionContext("any-token", "org-slug");

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  describe("Under LOCAL Strategy", () => {
    beforeEach(() => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "LOCAL");
    });

    it("should authorize a valid local customer HS256 token", async () => {
      const context = createExecutionContext("local-token", "org-slug");
      vi.mocked(v3AuthService.verifyToken).mockResolvedValue({
        sub: "cust-1",
        sessionId: "sess-1",
        customerEmail: "cust@example.com",
        customerName: "Customer One",
        organizationId: "org-1",
        type: "v3_customer",
      });
      vi.mocked(redisService.get).mockResolvedValue("active-session");

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(verifyZitadelJwt).not.toHaveBeenCalled();
    });

    it("should completely skip/ignore Zitadel token checks even if Bearer token is provided", async () => {
      const context = createExecutionContext("some-zitadel-style-token", "org-slug");
      vi.mocked(v3AuthService.verifyToken).mockRejectedValue(new Error("invalid hs256"));
      vi.mocked(authService.auth.api.getSession).mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      expect(verifyZitadelJwt).not.toHaveBeenCalled();
    });
  });

  describe("Under ZITADEL Strategy", () => {
    beforeEach(() => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "ZITADEL");
    });

    it("should reject standard HS256 customer session tokens", async () => {
      const context = createExecutionContext("local-token", "org-slug");
      vi.mocked(v3AuthService.verifyToken).mockResolvedValue({
        sub: "cust-1",
        sessionId: "sess-1",
        customerEmail: "cust@example.com",
        customerName: "Customer One",
        organizationId: "org-1",
        type: "v3_customer",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should authorize valid Zitadel tokens", async () => {
      const context = createExecutionContext("zitadel-token", "org-slug");
      vi.mocked(v3AuthService.verifyToken).mockRejectedValue(new Error("invalid hs256"));
      vi.mocked(verifyZitadelJwt).mockResolvedValue({
        sub: "zit-user-123",
        email: "cust@example.com",
        scope: "openid offline_access",
      } as any);

      vi.mocked(prisma.client.externalMapping.findFirst).mockResolvedValue({
        internalId: "cust-123",
      } as any);

      vi.mocked(prisma.client.customer.findUnique).mockResolvedValue({
        id: "cust-123",
        email: "cust@example.com",
        name: "Zitadel Customer",
      } as any);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(verifyZitadelJwt).toHaveBeenCalledWith("zitadel-token", null, expect.any(String), expect.any(String));
    });
  });

  describe("Under HYBRID Strategy", () => {
    beforeEach(() => {
      vi.stubEnv("CUSTOMER_AUTH_STRATEGY", "HYBRID");
    });

    it("should authorize both local customer tokens and Zitadel tokens", async () => {
      // 1. Check local token
      const contextLocal = createExecutionContext("local-token", "org-slug");
      vi.mocked(v3AuthService.verifyToken).mockResolvedValue({
        sub: "cust-1",
        sessionId: "sess-1",
        customerEmail: "cust@example.com",
        customerName: "Customer One",
        organizationId: "org-1",
        type: "v3_customer",
      });
      vi.mocked(redisService.get).mockResolvedValue("active-session");

      const resultLocal = await guard.canActivate(contextLocal);
      expect(resultLocal).toBe(true);

      // 2. Check Zitadel token
      const contextZitadel = createExecutionContext("zitadel-token", "org-slug");
      vi.mocked(v3AuthService.verifyToken).mockRejectedValue(new Error("invalid hs256"));
      vi.mocked(verifyZitadelJwt).mockResolvedValue({
        sub: "zit-user-123",
        email: "cust@example.com",
        scope: "openid offline_access",
      } as any);

      vi.mocked(prisma.client.externalMapping.findFirst).mockResolvedValue({
        internalId: "cust-123",
      } as any);

      vi.mocked(prisma.client.customer.findUnique).mockResolvedValue({
        id: "cust-123",
        email: "cust@example.com",
        name: "Zitadel Customer",
      } as any);

      const resultZitadel = await guard.canActivate(contextZitadel);
      expect(resultZitadel).toBe(true);
    });
  });
});
