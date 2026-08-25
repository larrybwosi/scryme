import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock @repo/db with importOriginal
vi.mock("@repo/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/db")>();
  return {
    ...actual,
    db: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
      },
    },
  };
});

// Mock @repo/shared/redis
vi.mock("@repo/shared/redis", () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue("OK"),
  }),
}));

// Mock ./auth
vi.mock("../auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { getServerAuth } from "../server";
import { auth } from "../auth";

describe("System Role Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return systemRole and allow access when user is SUPER_ADMIN even with MEMBER org role", async () => {
    const mockSession = {
      user: {
        id: "usr_123",
        email: "admin@scryme.tech",
        role: "MEMBER", // Org role
        systemRole: "SUPER_ADMIN", // System role
        activeOrganizationId: "org_123",
        memberId: "mem_123",
      },
      session: {
        id: "sess_123",
        activeOrganizationId: "org_123",
        isOrgSuspended: false,
      },
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);

    const authContext = await getServerAuth({ permission: "delete_organization" });

    expect(authContext).not.toBeNull();
    expect(authContext?.systemRole).toBe("SUPER_ADMIN");
    expect(authContext?.role).toBe("MEMBER");
  });

  it("should redirect to /unauthorized when non-SUPER_ADMIN user lacks required member permission", async () => {
    const mockSession = {
      user: {
        id: "usr_456",
        email: "user@scryme.tech",
        role: "MEMBER",
        systemRole: "MEMBER",
        activeOrganizationId: "org_123",
        memberId: "mem_456",
      },
      session: {
        id: "sess_456",
        activeOrganizationId: "org_123",
        isOrgSuspended: false,
      },
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);

    await expect(getServerAuth({ permission: "delete_organization" })).rejects.toThrow("REDIRECT:/unauthorized");
  });

  it("should correctly identify super admin based on systemRole", () => {
    const user = {
      id: "usr_789",
      role: "MEMBER", // org role
      systemRole: "SUPER_ADMIN", // system role
    };

    const isSuperAdmin = (user.systemRole || user.role) === "SUPER_ADMIN";
    expect(isSuperAdmin).toBe(true);

    const normalUser = {
      id: "usr_000",
      role: "ADMIN", // org role (e.g. org admin)
      systemRole: "MEMBER", // system role is normal member
    };

    const isNormalUserSuperAdmin = (normalUser.systemRole || normalUser.role) === "SUPER_ADMIN";
    expect(isNormalUserSuperAdmin).toBe(false);
  });

  it("should preserve systemRole along with organization role in session mapping", () => {
    const baseUser = {
      id: "usr_999",
      email: "super@scryme.tech",
      role: "SUPER_ADMIN", // User database role
    };

    const memberData = {
      memberId: "mem_999",
      role: "MEMBER", // Org member role
    };

    const systemRole = baseUser.role;

    const customUserData = {
      activeOrganizationId: "org_999",
      memberId: memberData.memberId,
      role: memberData.role || systemRole,
      systemRole,
      isOrgSuspended: false,
    };

    const mappedUser = { ...baseUser, ...customUserData };

    expect(mappedUser.systemRole).toBe("SUPER_ADMIN");
    expect(mappedUser.role).toBe("MEMBER");
  });
});
