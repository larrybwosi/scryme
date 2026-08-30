import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { V3AuthGuard } from "../v3-auth.guard";
import { V3AuthCoreService } from "../../../modules/auth-core/infrastructure/services/v3-auth-core.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("V3AuthGuard POS Authentication & Authorization", () => {
  let guard: V3AuthGuard;
  let v3AuthService: V3AuthCoreService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V3AuthGuard,
        Reflector,
        {
          provide: PrismaService,
          useValue: {
            client: {
              organization: {
                findUnique: vi.fn(),
              },
              deviceRegistry: {
                findFirst: vi.fn(),
              },
            },
          },
        },
        {
          provide: V3AuthCoreService,
          useValue: {
            verifyToken: vi.fn(),
            validateClient: vi.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<V3AuthGuard>(V3AuthGuard);
    v3AuthService = module.get<V3AuthCoreService>(V3AuthCoreService);
    prisma = module.get<PrismaService>(PrismaService);

    // Inject mocked v3AuthService manually into guard
    (guard as any).v3AuthService = v3AuthService;
  });

  const createMockContext = (headers: Record<string, string>, params: Record<string, string> = {}): ExecutionContext => {
    const request = {
      headers,
      params,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  };

  it("should throw UnauthorizedException if both Bearer token and X-API-KEY header are missing", async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should authenticate POS terminal request via X-API-KEY without client secret", async () => {
    const mockClient = {
      id: "client-db-1",
      clientId: "pos_terminal_123",
      organizationId: "org-1",
      organization: { id: "org-1", slug: "test-org" },
      businessAccountId: null,
      scopes: ["*"],
    };

    const mockRegistry = {
      id: "device-reg-1",
      locationId: "loc-hq",
    };

    vi.mocked(v3AuthService.validateClient).mockResolvedValue(mockClient as any);
    vi.mocked(prisma.client.deviceRegistry.findFirst as any).mockResolvedValue(mockRegistry);
    vi.mocked(prisma.client.organization.findUnique as any).mockResolvedValue(mockClient.organization);

    const context = createMockContext({
      "x-api-key": "pos_terminal_123",
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);

    const req = context.switchToHttp().getRequest() as any;
    expect(req.v3Context).toEqual({
      clientId: "pos_terminal_123",
      organizationId: "org-1",
      orgSlug: "test-org",
      businessAccountId: null,
      scopes: ["*"],
      organization: mockClient.organization,
      memberId: null,
      deviceId: "device-reg-1",
      locationId: "loc-hq",
      authType: "v3_client",
      customerId: null,
      sessionId: null,
      customer: null,
    });
  });

  it("should parse clientId from clientId.secret format in X-API-KEY header", async () => {
    const mockClient = {
      id: "client-db-2",
      clientId: "pos_terminal_456",
      organizationId: "org-2",
      organization: { id: "org-2", slug: "my-shop" },
      scopes: ["pos:read"],
    };

    vi.mocked(v3AuthService.validateClient).mockResolvedValue(mockClient as any);
    vi.mocked(prisma.client.deviceRegistry.findFirst as any).mockResolvedValue({ id: "device-reg-2", locationId: "loc-branch-2" });
    vi.mocked(prisma.client.organization.findUnique as any).mockResolvedValue(mockClient.organization);

    const context = createMockContext({
      "x-api-key": "pos_terminal_456.rawSecretToken123",
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(v3AuthService.validateClient).toHaveBeenCalledWith("pos_terminal_456", "rawSecretToken123");
  });

  it("should authenticate POS member request via X-MEMBER-TOKEN header without Bearer prefix", async () => {
    const mockOrg = { id: "org-1", slug: "test-org" };
    const mockPayload = {
      type: "v3_hybrid",
      clientId: "pos_123",
      organizationId: "org-1",
      memberId: "member-1",
      deviceId: "device-1",
      locationId: "loc-1",
      scopes: ["*"],
    };

    vi.mocked(v3AuthService.verifyToken).mockResolvedValue(mockPayload as any);
    vi.mocked(prisma.client.organization.findUnique as any).mockResolvedValue(mockOrg);

    const context = createMockContext({
      "x-member-token": "jwt_member_token_123",
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(v3AuthService.verifyToken).toHaveBeenCalledWith("jwt_member_token_123");

    const req = context.switchToHttp().getRequest() as any;
    expect(req.v3Context.memberId).toBe("member-1");
    expect(req.v3Context.authType).toBe("v3_hybrid");
  });

  it("should authenticate POS member request via X-MEMBER-TOKEN header with Bearer prefix", async () => {
    const mockOrg = { id: "org-1", slug: "test-org" };
    const mockPayload = {
      type: "v3_hybrid",
      clientId: "pos_123",
      organizationId: "org-1",
      memberId: "member-1",
      deviceId: "device-1",
      locationId: "loc-1",
      scopes: ["*"],
    };

    vi.mocked(v3AuthService.verifyToken).mockResolvedValue(mockPayload as any);
    vi.mocked(prisma.client.organization.findUnique as any).mockResolvedValue(mockOrg);

    const context = createMockContext({
      "X-MEMBER-TOKEN": "Bearer jwt_member_token_456",
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(v3AuthService.verifyToken).toHaveBeenCalledWith("jwt_member_token_456");
  });
});
