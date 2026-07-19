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
        findUnique: vi.fn(),
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

  it("should return true if no permissions are required", async () => {
    const context = createMockHttpContext({ requiredPermissions: undefined });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw ForbiddenException if user or organization not identified", async () => {
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

  it("should allow access if permissions are cached in Redis", async () => {
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
    expect(mockPrisma.client.member.findUnique).not.toHaveBeenCalled();
  });

  it("should allow OWNER bypass and fetch/cache permissions from Prisma", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["any:permission"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findUnique.mockResolvedValue({
      id: "member1",
      role: "OWNER",
      organizationId: "org1",
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

  it("should fetch member permissions, deduplicate, cache and authorize custom role permissions", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["members:read", "members:write"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findUnique.mockResolvedValue({
      id: "member1",
      role: "MEMBER",
      organizationId: "org1",
      customRoles: [
        { permissions: ["members:read", "members:write"] },
        { permissions: ["members:read"] }, // duplicate
      ],
      roleGroups: [],
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockRedis.setex).toHaveBeenCalledWith(
      "permissions:org1:member1",
      3600,
      ["members:read", "members:write"],
    );
  });

  it("should fetch role group permissions and authorize them", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["members:read"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findUnique.mockResolvedValue({
      id: "member1",
      role: "MEMBER",
      organizationId: "org1",
      customRoles: [],
      roleGroups: [
        {
          permissionSets: [
            { permissions: ["members:read"] },
          ],
        },
      ],
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should support wildcard matching", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["members:read", "members:write"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findUnique.mockResolvedValue({
      id: "member1",
      role: "MEMBER",
      organizationId: "org1",
      customRoles: [
        { permissions: ["members:*"] },
      ],
      roleGroups: [],
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw ForbiddenException if required permissions are not matched", async () => {
    const context = createMockHttpContext({
      requiredPermissions: ["members:write"],
      v3Context: { organizationId: "org1", memberId: "member1" },
      user: { id: "user1" },
      organization: { id: "org1" },
    });

    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.member.findUnique.mockResolvedValue({
      id: "member1",
      role: "MEMBER",
      organizationId: "org1",
      customRoles: [
        { permissions: ["members:read"] },
      ],
      roleGroups: [],
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException("Insufficient permissions"),
    );
  });
});
