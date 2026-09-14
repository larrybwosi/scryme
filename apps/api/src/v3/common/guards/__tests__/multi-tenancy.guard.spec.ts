import { MultiTenancyGuard } from "../multi-tenancy.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { ExecutionContext, NotFoundException, ForbiddenException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("MultiTenancyGuard - Cross Tenant Isolation", () => {
  let guard: MultiTenancyGuard;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      organization: {
        findUnique: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    prisma = mockPrisma as any;
    guard = new MultiTenancyGuard(prisma);
    vi.clearAllMocks();
  });

  function createMockHttpContext(params: {
    orgSlug?: string;
    headers?: Record<string, string>;
    user?: any;
    v3Context?: any;
  }): ExecutionContext {
    const mockRequest = {
      params: { orgSlug: params.orgSlug },
      headers: params.headers || {},
      user: params.user,
      v3Context: params.v3Context,
      organization: null,
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

  it("should pass through if no organization slug is present", async () => {
    const context = createMockHttpContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw NotFoundException if requested organization slug does not exist", async () => {
    mockPrisma.client.organization.findUnique.mockResolvedValue(null);

    const context = createMockHttpContext({ orgSlug: "non-existent-org" });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new NotFoundException('Organization with slug "non-existent-org" not found'),
    );
  });

  it("should attach organization to request for super admin users", async () => {
    mockPrisma.client.organization.findUnique.mockResolvedValue({
      id: "org_target",
      slug: "target-org",
      name: "Target Org",
    });

    const context = createMockHttpContext({
      orgSlug: "target-org",
      user: { id: "superadmin_user", role: "SUPER_ADMIN" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.organization.id).toBe("org_target");
  });

  it("should throw ForbiddenException if user belongs to Org A and attempts to access Org B", async () => {
    mockPrisma.client.organization.findUnique.mockResolvedValue({
      id: "org_b",
      slug: "org-b",
      name: "Organization B",
    });

    mockPrisma.client.member.findFirst.mockResolvedValue(null); // Not a member of Org B

    const context = createMockHttpContext({
      orgSlug: "org-b",
      user: { id: "member_of_org_a", role: "MEMBER" },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException("Access denied: You are not an active member of this organization"),
    );

    expect(mockPrisma.client.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org_b",
        userId: "member_of_org_a",
        deletedAt: null,
      },
    });
  });

  it("should allow access if user is an active member of target organization", async () => {
    mockPrisma.client.organization.findUnique.mockResolvedValue({
      id: "org_b",
      slug: "org-b",
      name: "Organization B",
    });

    mockPrisma.client.member.findFirst.mockResolvedValue({
      id: "member_id_123",
      organizationId: "org_b",
      userId: "member_user",
      isActive: true,
    });

    const context = createMockHttpContext({
      orgSlug: "org-b",
      user: { id: "member_user", role: "MEMBER" },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
