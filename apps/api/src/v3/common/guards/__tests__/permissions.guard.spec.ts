import { PermissionsGuard } from "../permissions.guard";
import { Reflector } from "@nestjs/core";
import { RedisService } from "../../../../redis/redis.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("PermissionsGuard", () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let redis: RedisService;
  let prisma: PrismaService;

  const mockReflector = {
    get: vi.fn(),
  };

  const mockRedis = {
    get: vi.fn(),
    setex: vi.fn(),
  };

  const mockPrisma = {
    client: {
      member: {
        findFirst: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    reflector = mockReflector as any;
    redis = mockRedis as any;
    prisma = mockPrisma as any;
    guard = new PermissionsGuard(reflector, redis, prisma);
    vi.clearAllMocks();
  });

  function createMockHttpContext(options: {
    requiredPermissions?: string[];
    v3Context?: any;
    user?: any;
    organization?: any;
  }): ExecutionContext {
    mockReflector.get.mockReturnValue(options.requiredPermissions);

    const mockRequest = {
      v3Context: options.v3Context,
      user: options.user,
      organization: options.organization,
    };

    return {
      getType: () => "http",
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  }

  it("should return true if no permissions are required and no organization context present", async () => {
    const context = createMockHttpContext({ requiredPermissions: undefined });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should return true immediately if user has SUPER_ADMIN role or systemRole", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["super:secret:permission"],
      user: { id: "admin1", role: "SUPER_ADMIN" },
      organization: { id: "org1" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw ForbiddenException if user or organization not identified for protected route", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["test:permission"],
      user: null,
      organization: null,
      v3Context: null,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException("User/Member or Organization not identified"),
    );
  });

  it("should throw ForbiddenException if user is NOT an active member of target organization", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["test:permission"],
      user: { id: "user_from_org_a" },
      organization: { id: "org_b" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException("Access denied: You are not an active member of this organization"),
    );
  });

  it("should allow access if permissions are cached in Redis for valid member", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["test:permission"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(["test:permission"]);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockRedis.get).toHaveBeenCalledWith("permissions:org1:member1");
  });

  it("should allow OWNER bypass and fetch/cache permissions from Prisma", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["any:permission"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findFirst.mockResolvedValue({
      id: "member1",
      role: "OWNER",
      organizationId: "org1",
      isActive: true,
      customRoles: [],
      roleGroups: [],
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockRedis.setex).toHaveBeenCalledWith(
      "permissions:org1:member1",
      3600,
      ["*"],
    );
  });

  it("should authorize v3_client tokens directly using client scopes", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["catalog:product:read"],
      v3Context: {
        authType: "v3_client",
        scopes: ["catalog:product:read"],
      },
      organization: { id: "org1", slug: "org-1" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should authorize v3_customer tokens using default customer permissions", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["catalog:product:read", "services:read"],
      v3Context: {
        authType: "v3_customer",
      },
      organization: { id: "org1", slug: "org-1" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
