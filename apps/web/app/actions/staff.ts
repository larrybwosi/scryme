"use server";

import { db } from "@repo/db";
import { getServerAuth, auth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { MemberRole, MembershipStatus, Member, User } from "@repo/db";
import * as argon2 from "argon2";
import { randomBytes, randomInt } from "crypto";

async function checkStaffManagementPermission(session: any) {
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const memberRole = session.role as MemberRole;
  const isOwner = memberRole === "OWNER";
  const isAdmin = memberRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Forbidden: Insufficient permissions" };
  }

  if (isAdmin) {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId: session.organizationId },
      select: { adminsCanManageStaff: true },
    });

    if (!settings?.adminsCanManageStaff) {
      return {
        success: false,
        error: "Forbidden: Admin staff management is disabled",
      };
    }
  }

  return { success: true };
}

export async function getStaffMembers() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const members = await db.member.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      role: true,
      membershipStatus: true,
      createdAt: true,
      banReason: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      customRoles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { success: true, data: members };
}

export async function addStaffMember(data: {
  email: string;
  name: string;
  role: MemberRole;
  password?: string;
}) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const permission = await checkStaffManagementPermission(session);
  if (!permission.success) return permission;

  try {
    // Check if user exists
    let user = await db.user.findUnique({
      where: { email: data.email },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create user using better-auth admin API
      const password =
        data.password ||
        Array.from(randomBytes(12))
          .map(
            (b: any) =>
              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"[
                b % 74
              ],
          )
          .join("");

      try {
        await (auth.api as any).createUser({
          headers: await headers(),
          body: {
            email: data.email,
            password: password,
            name: data.name,
          },
        });
      } catch (e) {
        console.error("Better-auth createUser failed, falling back to direct db create:", e);
        // Fallback for non-system-admin organization owners
        await db.user.create({
          data: {
            email: data.email,
            name: data.name,
            password: await argon2.hash(password),
          },
        });
      }

      // The user is created, now find it to get the ID
      user = await db.user.findUnique({
        where: { email: data.email },
      });
    }

    if (!user) {
      return { success: false, error: "Failed to create or find user" };
    }

    // Check if already a member
    const existingMember = await db.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return {
        success: false,
        error: "User is already a member of this organization",
      };
    }

    // Create member record
    await db.member.create({
      data: {
        organizationId: session.organizationId,
        userId: user.id,
        role: data.role,
        email: data.email,
        isActive: true,
      },
    });

    revalidatePath("/staff");
    return {
      success: true,
      isNewUser
    };
  } catch (error: any) {
    console.error("Error adding staff member:", error);
    return {
      success: false,
      error: error.message || "Failed to add staff member",
    };
  }
}

export async function updateMemberRole(memberId: string, role: MemberRole) {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: { role },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${memberId}`);
  return { success: true };
}

export async function getStaffMemberDetail(
  memberId: string,
): Promise<{ success: boolean; data?: any; error?: string; stats?: any }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  // Security check: Only admins/owners or the user themselves
  const isSelf = session.memberId === memberId;
  const isAdmin = ["ADMIN", "OWNER"].includes(session.role as string);

  if (!isSelf && !isAdmin) {
    return { success: false, error: "Forbidden" };
  }

  const member = await db.member.findUnique({
    where: {
      id: memberId,
      organizationId: session.organizationId,
    },
    select: {
      id: true,
      organizationId: true,
      role: true,
      membershipStatus: true,
      isActive: true,
      cardId: true,
      createdAt: true,
      updatedAt: true,
      phone: true,
      email: true,
      address: true,
      age: true,
      gender: true,
      tags: true,
      jobTitle: true,
      employmentType: true,
      joiningDate: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      emergencyContactRelation: true,
      managerId: true,
      manager: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
      customRoles: {
        select: {
          id: true,
          name: true,
        },
      },
      attendanceLogs: {
        take: 10,
        orderBy: { checkInTime: "desc" },
        select: {
          id: true,
          checkInTime: true,
          checkOutTime: true,
          durationMinutes: true,
          checkInLocation: {
            select: { id: true, name: true },
          },
          checkOutLocation: {
            select: { id: true, name: true },
          },
        },
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          finalTotal: true,
          currencyCode: true,
          status: true,
          createdAt: true,
          location: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  // Calculate Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await db.$transaction(async tx => {
    const totalSales = await tx.transaction.aggregate({
      where: {
        memberId: memberId,
        organizationId: session.organizationId,
        status: "COMPLETED",
      },
      _sum: { finalTotal: true },
      _count: { id: true },
    });

    const monthlySales = await tx.transaction.aggregate({
      where: {
        memberId: memberId,
        organizationId: session.organizationId,
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { finalTotal: true },
      _count: { id: true },
    });

    const attendanceCount = await tx.attendanceLog.count({
      where: {
        memberId: memberId,
        organizationId: session.organizationId,
      },
    });

    return {
      totalSalesValue: Number(totalSales._sum.finalTotal) || 0,
      totalSalesCount: totalSales._count.id || 0,
      monthlySalesValue: Number(monthlySales._sum.finalTotal) || 0,
      monthlySalesCount: monthlySales._count.id || 0,
      attendanceCount,
      avgTransactionValue:
        totalSales._count.id > 0
          ? Number(totalSales._sum.finalTotal) / totalSales._count.id
          : 0,
    };
  });

  return { success: true, data: member, stats };
}

export async function updateMemberCustomization(
  memberId: string,
  data: {
    cardId?: string;
    pin?: string;
    phone?: string;
    address?: string;
    age?: string;
    gender?: string;
    tags?: string;
    image?: string;
    jobTitle?: string;
    employmentType?: any;
    joiningDate?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    managerId?: string;
  },
) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const permission = await checkStaffManagementPermission(session);
  if (!permission.success) return permission;

  const updateData: any = {
    phone: data.phone,
    address: data.address,
    age: data.age,
    gender: data.gender,
    tags: data.tags,
    jobTitle: data.jobTitle,
    employmentType: data.employmentType === "" ? null : data.employmentType,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    emergencyContactRelation: data.emergencyContactRelation,
    managerId: data.managerId === "" ? null : data.managerId,
  };

  if (data.cardId !== undefined) {
    updateData.cardId = data.cardId === "" ? null : data.cardId;
  }

  if (data.pin) {
    if (!/^\d{6}$/.test(data.pin)) {
      return { success: false, error: "PIN must be 6 digits" };
    }
    updateData.pinHash = await argon2.hash(data.pin);
  }

  try {
    const member = await db.member.update({
      where: { id: memberId, organizationId: session.organizationId },
      data: updateData,
      select: { userId: true },
    });

    if (data.image) {
      await db.user.update({
        where: { id: member.userId },
        data: { image: data.image },
      });
    }

    revalidatePath("/staff");
    revalidatePath(`/staff/${memberId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating member customization:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Card ID already in use" };
    }
    return { success: false, error: error.message };
  }
}

export async function generateMemberPin(memberId: string): Promise<any> {
  const session = await getServerAuth();
  const permission = await checkStaffManagementPermission(session);
  if (!permission.success) return permission;

  const pin = randomInt(100000, 999999).toString();
  const pinHash = await argon2.hash(pin);

  await db.member.update({
    where: { id: memberId, organizationId: session!.organizationId },
    data: { pinHash },
  });

  revalidatePath(`/staff/${memberId}`);
  return { success: true, pin };
}

export async function generateMemberCardId(memberId: string): Promise<any> {
  const session = await getServerAuth();
  const permission = await checkStaffManagementPermission(session);
  if (!permission.success) return permission;

  const cardId = randomBytes(4).toString("hex").toUpperCase();

  try {
    await db.member.update({
      where: { id: memberId, organizationId: session!.organizationId },
      data: { cardId },
    });

    revalidatePath(`/staff/${memberId}`);
    return { success: true, cardId };
  } catch (error: any) {
    if (error.code === "P2002") {
      // Retry once if collision
      const newCardId = randomBytes(4).toString("hex").toUpperCase();
      await db.member.update({
        where: { id: memberId, organizationId: session!.organizationId },
        data: { cardId: newCardId },
      });
      return { success: true, cardId: newCardId };
    }
    return { success: false, error: error.message };
  }
}

export async function resetMemberPassword(
  memberId: string,
  newPassword?: string,
): Promise<any> {
  const session = await getServerAuth();
  const permission = await checkStaffManagementPermission(session);
  if (!permission.success) return permission;

  const member = await db.member.findUnique({
    where: { id: memberId, organizationId: session!.organizationId },
    select: { userId: true },
  });

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  const password =
    newPassword ||
    Array.from(randomBytes(12))
      .map(
        (b: any) =>
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"[
            b % 74
          ],
      )
      .join("");

  try {
    try {
      await (auth.api as any).setPassword({
        headers: await headers(),
        body: {
          userId: member.userId,
          newPassword: password,
        },
      });
    } catch (e) {
      console.error("Better-auth setPassword failed, falling back to direct db update:", e);
      // Fallback for non-system-admin organization owners
      await db.user.update({
        where: { id: member.userId },
        data: {
          password: await argon2.hash(password),
        },
      });
    }

    return { success: true, password };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: error.message || "Failed to reset password",
    };
  }
}

export async function blockMember(memberId: string, reason: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: {
      membershipStatus: "SUSPENDED",
      isActive: false,
      banReason: reason,
    },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${memberId}`);
  return { success: true };
}

export async function unblockMember(memberId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: {
      membershipStatus: "ACTIVE",
      isActive: true,
      banReason: null,
    },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${memberId}`);
  return { success: true };
}

export async function getMemberSessions(userId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  // Verify user belongs to the same organization
  const membership = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.organizationId,
        userId: userId,
      },
    },
  });

  if (!membership)
    return {
      success: false,
      error: "Forbidden: User not in your organization",
    };

  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return { success: true, data: sessions };
}

export async function revokeSession(token: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  const targetSession = await db.session.findUnique({
    where: { token },
    select: { userId: true },
  });

  if (!targetSession) return { success: false, error: "Session not found" };

  // Verify user belongs to the same organization
  const membership = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.organizationId,
        userId: targetSession.userId,
      },
    },
  });

  if (!membership) return { success: false, error: "Forbidden" };

  await db.session.delete({
    where: { token },
  });

  return { success: true };
}

export async function getOrgCustomRoles() {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  const roles = await db.customRole.findMany({
    where: { organizationId: session.organizationId, isActive: true },
  });

  return { success: true, data: roles };
}

export async function updateMemberCustomRoles(
  memberId: string,
  roleIds: string[],
) {
  const session = await getServerAuth();
  if (!session || !session.organizationId)
    return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: {
      customRoles: {
        set: roleIds.map(id => ({ id })),
      },
    },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${memberId}`);
  return { success: true };
}
