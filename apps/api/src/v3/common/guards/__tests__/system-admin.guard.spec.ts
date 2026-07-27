import { SystemAdminGuard } from "../system-admin.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { ExecutionContext, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("SystemAdminGuard", () => {
  let guard: SystemAdminGuard;
  let prisma: PrismaService;
  let authService: AuthService;

  const mockPrisma = {
    client: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };

  const mockAuthService = {
    auth: {
      api: {
        getSession: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    prisma = mockPrisma as any;
    authService = mockAuthService as any;
    guard = new SystemAdminGuard(prisma, authService);
    vi.clearAllMocks();
  });

  function createMockExecutionContext(headers: any = {}): { context: ExecutionContext; request: any } {
    const request = {
      headers,
      user: undefined,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it("should allow access and set request.user if user has SUPER_ADMIN role", async () => {
    const { context, request } = createMockExecutionContext({
      authorization: "Bearer some-token",
    });

    mockAuthService.auth.api.getSession.mockResolvedValue({
      user: { id: "admin-user-id" },
    });

    mockPrisma.client.user.findUnique.mockResolvedValue({
      id: "admin-user-id",
      name: "Super Admin",
      email: "admin@scryme.tech",
      role: "SUPER_ADMIN",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: "admin-user-id",
      name: "Super Admin",
      email: "admin@scryme.tech",
      role: "SUPER_ADMIN",
    });
    expect(mockAuthService.auth.api.getSession).toHaveBeenCalled();
    expect(mockPrisma.client.user.findUnique).toHaveBeenCalledWith({
      where: { id: "admin-user-id" },
      select: { id: true, name: true, email: true, role: true },
    });
  });

  it("should throw UnauthorizedException if no session is resolved", async () => {
    const { context } = createMockExecutionContext();

    mockAuthService.auth.api.getSession.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw ForbiddenException if user role is not SUPER_ADMIN", async () => {
    const { context } = createMockExecutionContext();

    mockAuthService.auth.api.getSession.mockResolvedValue({
      user: { id: "regular-user-id" },
    });

    mockPrisma.client.user.findUnique.mockResolvedValue({
      id: "regular-user-id",
      name: "Regular User",
      email: "user@scryme.tech",
      role: "MEMBER",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
