import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    member: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
    },
    scrymeConfiguration: {
      findUnique: vi.fn(),
    },
    scrymeMessage: {
      create: vi.fn(),
    },
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock @repo/chat
vi.mock("@repo/chat", () => ({
  ScrymeChatApiClient: vi.fn().mockImplementation(() => ({
    createChannel: vi.fn().mockResolvedValue({}),
    sendMessage: vi.fn().mockResolvedValue({ id: "msg-1", channelSlug: "admins" }),
  })),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { approvePermissionRequestAction } from "../permissions";

describe("Permissions Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("approvePermissionRequestAction", () => {
    it("should return error if caller is unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await approvePermissionRequestAction({
        memberId: "target-member-1",
        roleToGrant: "MANAGER",
      });

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: Please log in again.",
      });
      expect(db.member.findFirst).not.toHaveBeenCalled();
    });

    it("should reject request if caller member profile is not found or lacks admin roles", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "caller-mem-1",
      });
      (db.member.findFirst as any).mockResolvedValue({
        id: "caller-mem-1",
        role: "EMPLOYEE",
        organizationId: "org-1",
      });

      const result = await approvePermissionRequestAction({
        memberId: "target-member-1",
        roleToGrant: "MANAGER",
      });

      expect(result).toEqual({
        success: false,
        error: "Forbidden: Only admins can approve permission requests.",
      });
      expect(db.member.updateMany).not.toHaveBeenCalled();
    });

    it("should reject privilege escalation when an ADMIN attempts to grant the OWNER role", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "admin-mem-1",
      });
      (db.member.findFirst as any).mockResolvedValue({
        id: "admin-mem-1",
        role: "ADMIN",
        organizationId: "org-1",
      });

      const result = await approvePermissionRequestAction({
        memberId: "target-member-1",
        roleToGrant: "OWNER",
      });

      expect(result).toEqual({
        success: false,
        error: "Forbidden: Only organization owners can grant the OWNER role.",
      });
      expect(db.member.updateMany).not.toHaveBeenCalled();
    });

    it("should reject update if target member belongs to a foreign organization or does not exist", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "owner-mem-1",
      });
      (db.member.findFirst as any)
        .mockResolvedValueOnce({
          id: "owner-mem-1",
          role: "OWNER",
          organizationId: "org-1",
        })
        .mockResolvedValueOnce(null); // target member lookup fails due to organizationId filter

      const result = await approvePermissionRequestAction({
        memberId: "foreign-member-id",
        roleToGrant: "ADMIN",
      });

      expect(result).toEqual({
        success: false,
        error: "Target member not found.",
      });
      expect(db.member.findFirst).toHaveBeenNthCalledWith(2, {
        where: { id: "foreign-member-id", organizationId: "org-1" },
      });
      expect(db.member.updateMany).not.toHaveBeenCalled();
    });

    it("should allow an OWNER to grant OWNER role and update target member using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "owner-mem-1",
      });
      (db.member.findFirst as any)
        .mockResolvedValueOnce({
          id: "owner-mem-1",
          role: "OWNER",
          organizationId: "org-1",
        })
        .mockResolvedValueOnce({
          id: "target-mem-1",
          organizationId: "org-1",
          role: "EMPLOYEE",
        });

      (db.member.updateMany as any).mockResolvedValue({ count: 1 });
      (db.member.findFirstOrThrow as any).mockResolvedValue({
        id: "target-mem-1",
        organizationId: "org-1",
        role: "OWNER",
        membershipStatus: "ACTIVE",
        isActive: true,
      });

      const result = await approvePermissionRequestAction({
        memberId: "target-mem-1",
        roleToGrant: "OWNER",
      });

      expect(result).toEqual({
        success: true,
        member: {
          id: "target-mem-1",
          organizationId: "org-1",
          role: "OWNER",
          membershipStatus: "ACTIVE",
          isActive: true,
        },
      });

      expect(db.member.updateMany).toHaveBeenCalledWith({
        where: { id: "target-mem-1", organizationId: "org-1" },
        data: {
          role: "OWNER",
          membershipStatus: "ACTIVE",
          isActive: true,
        },
      });
    });

    it("should allow an ADMIN to grant MANAGER role successfully", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "admin-mem-1",
      });
      (db.member.findFirst as any)
        .mockResolvedValueOnce({
          id: "admin-mem-1",
          role: "ADMIN",
          organizationId: "org-1",
        })
        .mockResolvedValueOnce({
          id: "target-mem-2",
          organizationId: "org-1",
          role: "EMPLOYEE",
        });

      (db.member.updateMany as any).mockResolvedValue({ count: 1 });
      (db.member.findFirstOrThrow as any).mockResolvedValue({
        id: "target-mem-2",
        organizationId: "org-1",
        role: "MANAGER",
        membershipStatus: "ACTIVE",
        isActive: true,
      });

      const result = await approvePermissionRequestAction({
        memberId: "target-mem-2",
        roleToGrant: "MANAGER",
      });

      expect(result).toEqual({
        success: true,
        member: {
          id: "target-mem-2",
          organizationId: "org-1",
          role: "MANAGER",
          membershipStatus: "ACTIVE",
          isActive: true,
        },
      });

      expect(db.member.updateMany).toHaveBeenCalledWith({
        where: { id: "target-mem-2", organizationId: "org-1" },
        data: {
          role: "MANAGER",
          membershipStatus: "ACTIVE",
          isActive: true,
        },
      });
    });
  });
});
