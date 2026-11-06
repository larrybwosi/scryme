import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  UserRole: {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    DEVELOPER: "DEVELOPER",
    CLIENT: "CLIENT",
    MEMBER: "MEMBER",
  },
  MembershipStatus: {
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
  },
  db: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    member: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback: any) =>
      callback({
        user: { update: vi.fn().mockResolvedValue({ id: "user_1" }) },
        member: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }),
    ),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
  requireSuperAdmin: vi.fn().mockResolvedValue({ id: "admin_1" }),
}));

import { db } from "@repo/db";
import { listUsers, getUserDetails, banUser, unbanUser } from "../users";

describe("Admin Users Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listUsers", () => {
    it("should return paginated user results with default pagination", async () => {
      (db.user.count as any).mockResolvedValue(105);
      (db.user.findMany as any).mockResolvedValue([
        {
          id: "u1",
          name: "Test User",
          email: "test@example.com",
          role: "USER",
          isActive: true,
          banned: false,
          banReason: null,
          banExpires: null,
          acquisitionSource: "Direct",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { members: 2 },
        },
      ]);

      const result = await listUsers({ page: 2, pageSize: 50 });

      expect(db.user.count).toHaveBeenCalledWith({ where: undefined });
      expect(db.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 50,
        take: 50,
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 50,
        totalCount: 105,
        totalPages: 3,
      });
      expect(result.users).toHaveLength(1);
    });

    it("should filter by search query across multiple fields", async () => {
      (db.user.count as any).mockResolvedValue(1);
      (db.user.findMany as any).mockResolvedValue([]);

      await listUsers({ search: "alice" });

      expect(db.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
            { acquisitionSource: { contains: "alice", mode: "insensitive" } },
          ],
        },
      });
    });

    it("should match role when search string is a valid UserRole", async () => {
      (db.user.count as any).mockResolvedValue(1);
      (db.user.findMany as any).mockResolvedValue([]);

      await listUsers({ search: "admin" });

      expect(db.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "admin", mode: "insensitive" } },
            { email: { contains: "admin", mode: "insensitive" } },
            { acquisitionSource: { contains: "admin", mode: "insensitive" } },
            { role: "ADMIN" },
          ],
        },
      });
    });
  });

  describe("getUserDetails", () => {
    it("should fetch user details with relationships", async () => {
      const mockUser = {
        id: "u123",
        name: "Alice Doe",
        email: "alice@example.com",
        members: [
          {
            id: "m1",
            role: "OWNER",
            organization: { id: "org1", name: "Org 1", slug: "org-1" },
          },
        ],
        accounts: [],
        sessions: [],
        _count: { members: 1, sessions: 0, apikeys: 0, passkeys: 0 },
      };
      (db.user.findUnique as any).mockResolvedValue(mockUser);

      const user = await getUserDetails("u123");

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u123" },
        include: expect.objectContaining({
          members: expect.any(Object),
          accounts: expect.any(Object),
          sessions: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(user).toEqual(mockUser);
    });

    it("should throw error if user not found", async () => {
      (db.user.findUnique as any).mockResolvedValue(null);

      await expect(getUserDetails("invalid_id")).rejects.toThrow(
        "User with ID invalid_id not found",
      );
    });
  });

  describe("banUser & unbanUser", () => {
    it("should ban user and suspend their memberships", async () => {
      (db.user.findUnique as any).mockResolvedValue({ id: "u1" });

      await banUser("u1", { banReason: "Spam behavior" });

      expect(db.$transaction).toHaveBeenCalled();
    });

    it("should unban user and reactivate memberships", async () => {
      (db.user.findUnique as any).mockResolvedValue({ id: "u1" });

      await unbanUser("u1");

      expect(db.$transaction).toHaveBeenCalled();
    });
  });
});
