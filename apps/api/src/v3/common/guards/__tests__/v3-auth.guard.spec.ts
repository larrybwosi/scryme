import { describe, it, expect, beforeEach, vi } from "vitest";
import { V3AuthGuard } from "../v3-auth.guard";
import { UnauthorizedException } from "@nestjs/common";

describe("V3AuthGuard - Staff Member Better Auth Resolution", () => {
  let guard: V3AuthGuard;
  let mockPrisma: any;
  let mockModuleRef: any;
  let mockReflector: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        organization: {
          findUnique: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
        },
        customer: {
          findUnique: vi.fn(),
        },
      },
    };

    mockAuthService = {
      auth: {
        api: {
          getSession: vi.fn(),
        },
      },
    };

    mockModuleRef = {
      get: vi.fn((type: any) => {
        if (type.name === "AuthService" || type.name === "V3AuthCoreService") {
          return mockAuthService;
        }
        return null;
      }),
    };

    mockReflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };

    guard = new V3AuthGuard(mockPrisma as any, mockModuleRef as any, mockReflector as any);
  });

  it("should resolve Better Auth bearer token to a staff member session in v3Context", async () => {
    const mockRequest: any = {
      headers: {
        authorization: "Bearer valid-better-auth-token",
      },
      params: {},
    };

    const mockExecutionContext: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    };

    // Better Auth returns a valid session with user
    mockAuthService.auth.api.getSession.mockResolvedValue({
      user: {
        id: "usr-staff-1",
        email: "staff@scryme.com",
        name: "Staff User",
        activeOrganizationId: "org-1",
      },
      session: {
        activeOrganizationId: "org-1",
      },
    });

    // Organization lookup
    mockPrisma.client.organization.findUnique.mockResolvedValue({
      id: "org-1",
      slug: "test-org",
      name: "Test Org",
    });

    // Staff member lookup
    mockPrisma.client.member.findFirst.mockResolvedValue({
      id: "mem-staff-1",
      organizationId: "org-1",
      userId: "usr-staff-1",
      role: "MANAGER",
    });

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(mockRequest.v3Context).toBeDefined();
    expect(mockRequest.v3Context.authType).toBe("v3_hybrid");
    expect(mockRequest.v3Context.memberId).toBe("mem-staff-1");
    expect(mockRequest.v3Context.organizationId).toBe("org-1");
    expect(mockRequest.v3Context.orgSlug).toBe("test-org");
  });

  it("should throw UnauthorizedException if no token or API key is provided", async () => {
    const mockRequest: any = {
      headers: {},
      params: {},
    };

    const mockExecutionContext: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    };

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
