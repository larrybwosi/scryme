import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    invitation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    organizationSettings: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock @repo/shared/services/email
vi.mock("@repo/shared/services/email", () => ({
  sendOrganizationInvitationEmail: vi.fn().mockResolvedValue({ success: true, id: "msg_123" }),
}));

// Mock @repo/shared/redis
vi.mock("@repo/shared/redis", () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    del: vi.fn().mockResolvedValue(1),
  }),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { sendOrganizationInvitationEmail } from "@repo/shared/services/email";
import {
  getPendingInvitations,
  acceptInvitationByToken,
  getInvitationByToken,
  createOrgInvitation,
  revokeOrgInvitation,
  getOrgInvitations,
} from "../invitations";

describe("Invitations Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPendingInvitations", () => {
    it("should return unauthorized if user is not authenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getPendingInvitations();

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should return pending invitations for authenticated user email", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { email: "invited@example.com" },
      });

      const mockInvitations = [
        {
          id: "inv_1",
          email: "invited@example.com",
          status: "PENDING",
          organization: { id: "org_1", name: "Acme Corp", slug: "acme", logo: null, description: "Test" },
          inviter: { name: "Alice Owner", email: "alice@example.com", image: null },
        },
      ];

      (db.invitation.findMany as any).mockResolvedValue(mockInvitations);

      const result = await getPendingInvitations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitations);
      expect(db.invitation.findMany).toHaveBeenCalledWith({
        where: {
          email: { equals: "invited@example.com", mode: "insensitive" },
          status: "PENDING",
        },
        include: expect.any(Object),
      });
    });
  });

  describe("createOrgInvitation", () => {
    it("should fail if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await createOrgInvitation({ email: "newuser@example.com", role: "MEMBER" as any });

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should fail if member has non-admin/owner role", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_1", name: "Member User", email: "member@example.com" },
        organizationId: "org_1",
        orgRole: "MEMBER",
      });

      const result = await createOrgInvitation({ email: "newuser@example.com", role: "MEMBER" as any });

      expect(result).toEqual({ success: false, error: "Forbidden: Insufficient permissions" });
    });

    it("should fail if user is already a member of the organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_owner", name: "Owner", email: "owner@example.com" },
        organizationId: "org_1",
        orgRole: "OWNER",
      });

      (db.user.findUnique as any).mockResolvedValue({ id: "user_existing", email: "existing@example.com" });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem_existing", organizationId: "org_1", userId: "user_existing" });

      const result = await createOrgInvitation({ email: "existing@example.com", role: "MEMBER" as any });

      expect(result).toEqual({
        success: false,
        error: "This user is already a member of your organization.",
      });
    });

    it("should create invitation and send email link containing token", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_owner", name: "Alice Owner", email: "owner@example.com" },
        organizationId: "org_1",
        orgRole: "OWNER",
      });

      (db.user.findUnique as any).mockResolvedValue(null);
      (db.invitation.findFirst as any).mockResolvedValue(null);
      (db.organization.findUnique as any).mockResolvedValue({ name: "Acme Corp" });

      const createdInvitation = {
        id: "inv_new",
        organizationId: "org_1",
        email: "newuser@example.com",
        role: "MEMBER",
        token: "mock-token-uuid",
        status: "PENDING",
      };

      (db.invitation.create as any).mockResolvedValue(createdInvitation);

      const result = await createOrgInvitation({ email: "newuser@example.com", role: "MEMBER" as any });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdInvitation);
      expect(result.inviteLink).toContain("/invite/");
      expect(sendOrganizationInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newuser@example.com",
          inviterName: "Alice Owner",
          organizationName: "Acme Corp",
          role: "MEMBER",
        })
      );
    });
  });

  describe("getInvitationByToken", () => {
    it("should return error if invitation is not found", async () => {
      (db.invitation.findUnique as any).mockResolvedValue(null);

      const result = await getInvitationByToken("invalid-token");

      expect(result).toEqual({ success: false, error: "Invitation not found" });
    });

    it("should return error if invitation is not pending", async () => {
      (db.invitation.findUnique as any).mockResolvedValue({
        id: "inv_1",
        status: "ACCEPTED",
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await getInvitationByToken("token_123");

      expect(result).toEqual({
        success: false,
        error: "Invitation has already been accepted or is inactive",
      });
    });

    it("should return error if invitation is expired", async () => {
      (db.invitation.findUnique as any).mockResolvedValue({
        id: "inv_1",
        status: "PENDING",
        expiresAt: new Date(Date.now() - 86400000),
      });

      const result = await getInvitationByToken("token_123");

      expect(result).toEqual({ success: false, error: "Invitation has expired" });
    });

    it("should return valid pending invitation details", async () => {
      const mockInv = {
        id: "inv_1",
        status: "PENDING",
        email: "user@example.com",
        expiresAt: new Date(Date.now() + 86400000),
        organization: { name: "Acme Corp", logo: null },
        inviter: { name: "Alice Owner", email: "owner@example.com" },
      };

      (db.invitation.findUnique as any).mockResolvedValue(mockInv);

      const result = await getInvitationByToken("token_valid");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInv);
    });
  });

  describe("acceptInvitationByToken", () => {
    it("should fail if user is unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await acceptInvitationByToken("token_123");

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should fail if invitation is invalid or non-pending", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_1", email: "user@example.com" },
      });
      (db.invitation.findUnique as any).mockResolvedValue(null);

      const result = await acceptInvitationByToken("token_missing");

      expect(result).toEqual({ success: false, error: "Invalid or expired invitation" });
    });

    it("should fail if user email does not match invitation target email", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_1", email: "different@example.com" },
      });
      (db.invitation.findUnique as any).mockResolvedValue({
        id: "inv_1",
        token: "token_123",
        email: "target@example.com",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await acceptInvitationByToken("token_123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("This invitation was sent to target@example.com");
    });

    it("should successfully accept invitation, create member, update active organization and status", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_10", email: "newmember@example.com" },
      });

      (db.invitation.findUnique as any).mockResolvedValue({
        id: "inv_10",
        token: "token_10",
        organizationId: "org_target",
        email: "newmember@example.com",
        role: "MEMBER",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 86400000),
      });

      (db.member.findUnique as any).mockResolvedValue(null);
      (db.member.create as any).mockResolvedValue({ id: "mem_10" });
      (db.invitation.update as any).mockResolvedValue({ id: "inv_10", status: "ACCEPTED" });
      (db.user.update as any).mockResolvedValue({ id: "user_10", activeOrganizationId: "org_target" });

      const result = await acceptInvitationByToken("token_10");

      expect(result.success).toBe(true);
      expect(db.member.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org_target",
          userId: "user_10",
          role: "MEMBER",
        },
      });
      expect(db.invitation.update).toHaveBeenCalledWith({
        where: { id: "inv_10" },
        data: { status: "ACCEPTED" },
      });
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user_10" },
        data: { activeOrganizationId: "org_target" },
      });
    });
  });

  describe("revokeOrgInvitation", () => {
    it("should revoke pending invitation when called by owner", async () => {
      (getServerAuth as any).mockResolvedValue({
        user: { id: "user_owner" },
        organizationId: "org_1",
        orgRole: "OWNER",
      });

      (db.invitation.delete as any).mockResolvedValue({ id: "inv_to_revoke" });

      const result = await revokeOrgInvitation("inv_to_revoke");

      expect(result.success).toBe(true);
      expect(db.invitation.delete).toHaveBeenCalledWith({
        where: {
          id: "inv_to_revoke",
          organizationId: "org_1",
        },
      });
    });
  });
});
