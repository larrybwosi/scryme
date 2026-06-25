"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { DepartmentMemberRole } from "@repo/db";

async function checkAdminPermission() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    throw new Error("Unauthorized");
  }

  const isAdmin = ["ADMIN", "OWNER"].includes(session.role as string);
  if (!isAdmin) {
    throw new Error("Forbidden: Only admins can manage departments");
  }

  return session;
}

export async function getDepartments(search?: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const departments = await db.department.findMany({
      where: {
        organizationId: session.organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        head: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            departmentMembers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: departments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentDetail(id: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const department = await db.department.findUnique({
      where: {
        id,
        organizationId: session.organizationId,
      },
      include: {
        head: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        departmentMembers: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        activeBudget: true,
        budgets: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        purchaseApprovalChains: {
          include: {
            steps: {
              include: {
                approver: {
                  include: {
                    user: {
                      select: { name: true },
                    },
                  },
                },
              },
              orderBy: { stepOrder: "asc" },
            },
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    return { success: true, data: department };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDepartment(data: {
  name: string;
  description?: string;
  headId?: string;
  parentId?: string;
  locationId?: string;
  costCenterId?: string;
  image?: string;
  banner?: string;
  settings?: any;
}) {
  try {
    const session = await checkAdminPermission();

    const department = await db.department.create({
      data: {
        name: data.name,
        description: data.description,
        headId: data.headId === "none" ? null : data.headId,
        parentId: data.parentId === "none" ? null : data.parentId || null,
        locationId: data.locationId === "none" ? null : data.locationId || null,
        costCenterId: data.costCenterId === "none" ? null : data.costCenterId,
        image: data.image,
        banner: data.banner,
        settings: data.settings || {},
        organizationId: session.organizationId,
      },
    });

    // If a head is assigned, also add them as a department member with HEAD role
    if (data.headId && data.headId !== "none" && data.headId !== "") {
      await db.departmentMember.create({
        data: {
          departmentId: department.id,
          memberId: data.headId,
          role: "HEAD",
        },
      });
    }

    revalidatePath("/staff/departments");
    return { success: true, data: department };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    description?: string;
    headId?: string;
    parentId?: string;
    locationId?: string;
    costCenterId?: string;
    image?: string;
    banner?: string;
    settings?: any;
  },
) {
  try {
    const session = await checkAdminPermission();

    const oldDept = await db.department.findUnique({
      where: { id, organizationId: session.organizationId },
      select: { headId: true },
    });

    const department = await db.department.update({
      where: {
        id,
        organizationId: session.organizationId,
      },
      data: {
        name: data.name,
        description: data.description,
        headId:
          data.headId === "" || data.headId === "none" ? null : data.headId,
        parentId:
          data.parentId === "" || data.parentId === "none"
            ? null
            : data.parentId,
        locationId:
          data.locationId === "" || data.locationId === "none"
            ? null
            : data.locationId,
        costCenterId:
          data.costCenterId === "" || data.costCenterId === "none"
            ? null
            : data.costCenterId,
        image: data.image,
        banner: data.banner,
        settings: data.settings,
      },
    });

    // If head changed, handle department membership
    if (data.headId !== undefined && data.headId !== oldDept?.headId) {
      if (data.headId && data.headId !== "") {
        // Upsert the new head as a member with HEAD role
        await db.departmentMember.upsert({
          where: {
            departmentId_memberId: {
              departmentId: id,
              memberId: data.headId,
            },
          },
          update: { role: "HEAD" },
          create: {
            departmentId: id,
            memberId: data.headId,
            role: "HEAD",
          },
        });
      }
    }

    revalidatePath("/staff/departments");
    revalidatePath(`/staff/departments/${id}`);
    return { success: true, data: department };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await checkAdminPermission();

    await db.department.delete({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/staff/departments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Member Management ---

export async function addDepartmentMember(data: {
  departmentId: string;
  memberId: string;
  role: DepartmentMemberRole;
  canApproveExpenses?: boolean;
  canManageBudget?: boolean;
}) {
  try {
    const session = await checkAdminPermission();

    const member = await db.departmentMember.create({
      data: {
        departmentId: data.departmentId,
        memberId: data.memberId,
        role: data.role,
        canApproveExpenses: data.canApproveExpenses || false,
        canManageBudget: data.canManageBudget || false,
      },
    });

    revalidatePath(`/staff/departments/${data.departmentId}`);
    return { success: true, data: member };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartmentMember(
  id: string,
  data: {
    role?: DepartmentMemberRole;
    canApproveExpenses?: boolean;
    canManageBudget?: boolean;
  },
) {
  try {
    const session = await checkAdminPermission();

    const member = await db.departmentMember.update({
      where: { id },
      data,
    });

    revalidatePath(`/staff/departments/${member.departmentId}`);
    return { success: true, data: member };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeDepartmentMember(id: string) {
  try {
    const session = await checkAdminPermission();

    const member = await db.departmentMember.delete({
      where: { id },
    });

    revalidatePath(`/staff/departments/${member.departmentId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMembersForAssignment(departmentId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existingMemberIds = await db.departmentMember.findMany({
      where: { departmentId },
      select: { memberId: true },
    });

    const members = await db.member.findMany({
      where: {
        organizationId: session.organizationId,
        deletedAt: null,
        id: {
          notIn: existingMemberIds.map(m => m.memberId),
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return { success: true, data: members };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMemberDepartments(memberId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const memberships = await db.departmentMember.findMany({
      where: {
        memberId,
        department: {
          organizationId: session.organizationId,
        },
      },
      include: {
        department: true,
      },
    });

    return { success: true, data: memberships };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Enterprise Features ---

export async function createDepartmentBudget(data: {
  departmentId: string;
  name: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  fiscalYear?: number;
  makeActive?: boolean;
}) {
  try {
    const session = await checkAdminPermission();

    const budget = await db.$transaction(async tx => {
      const newBudget = await tx.budget.create({
        data: {
          organizationId: session.organizationId,
          departmentId: data.departmentId,
          name: data.name,
          amount: data.amount,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          description: data.description,
          fiscalYear: data.fiscalYear,
          createdById: session.memberId!,
        },
      });

      if (data.makeActive) {
        await tx.department.update({
          where: { id: data.departmentId },
          data: { activeBudgetId: newBudget.id },
        });
      }

      return newBudget;
    });

    revalidatePath(`/staff/departments/${data.departmentId}`);
    return { success: true, data: budget };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartmentActiveBudget(
  departmentId: string,
  budgetId: string | null,
) {
  try {
    await checkAdminPermission();

    await db.department.update({
      where: { id: departmentId },
      data: { activeBudgetId: budgetId },
    });

    revalidatePath(`/staff/departments/${departmentId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDepartmentApprovalChain(data: {
  departmentId: string;
  name: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  priority?: number;
  steps: { approverId: string; stepOrder: number }[];
}) {
  try {
    const session = await checkAdminPermission();

    const chain = await db.purchaseApprovalChain.create({
      data: {
        organizationId: session.organizationId,
        departmentId: data.departmentId,
        name: data.name,
        description: data.description,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        priority: data.priority || 0,
        steps: {
          create: data.steps.map(step => ({
            approverId: step.approverId,
            stepOrder: step.stepOrder,
          })),
        },
      },
    });

    revalidatePath(`/staff/departments/${data.departmentId}`);
    return { success: true, data: chain };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleApprovalChainStatus(id: string, isActive: boolean) {
  try {
    const session = await checkAdminPermission();

    const chain = await db.purchaseApprovalChain.update({
      where: { id, organizationId: session.organizationId },
      data: { isActive },
    });

    revalidatePath(`/staff/departments/${chain.departmentId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentStats() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [totalDepartments, totalMembers, totalBudget] = await Promise.all([
      db.department.count({
        where: { organizationId: session.organizationId },
      }),
      db.departmentMember.count({
        where: { department: { organizationId: session.organizationId } },
      }),
      db.budget.aggregate({
        where: {
          organizationId: session.organizationId,
          isActive: true,
          periodEnd: { gte: new Date() },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalDepartments,
        totalMembers,
        totalBudget: Number(totalBudget._sum.amount) || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
