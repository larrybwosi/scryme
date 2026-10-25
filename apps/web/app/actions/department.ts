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
    const department = await db.department.findFirst({
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

    const headIdValue = !data.headId || data.headId === "" || data.headId === "none" ? null : data.headId;
    const parentIdValue = !data.parentId || data.parentId === "" || data.parentId === "none" ? null : data.parentId;
    const locationIdValue = !data.locationId || data.locationId === "" || data.locationId === "none" ? null : data.locationId;
    const costCenterIdValue = !data.costCenterId || data.costCenterId === "" || data.costCenterId === "none" ? null : data.costCenterId;

    // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Relational Resource Assignment
    // MITIGATION: Validate all foreign relational IDs against current organizationId before creation.
    // ⚡ Bolt Optimization: Parallelize duplicate department name check and foreign relational ID validations with Promise.all.
    // Collapses up to 5 sequential blocking database queries into 1 concurrent roundtrip.
    const [existing, headMember, parentDepartment, location, costCenter] = await Promise.all([
      db.department.findFirst({
        where: {
          organizationId: session.organizationId,
          name: { equals: data.name, mode: "insensitive" },
        },
      }),
      headIdValue
        ? db.member.findFirst({
            where: { id: headIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
      parentIdValue
        ? db.department.findFirst({
            where: { id: parentIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
      locationIdValue
        ? db.inventoryLocation.findFirst({
            where: { id: locationIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
      costCenterIdValue
        ? db.costCenter.findFirst({
            where: { id: costCenterIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (existing) {
      return { success: false, error: "A department with this name already exists." };
    }

    if (headIdValue && !headMember) {
      return { success: false, error: "Department head not found or belongs to another organization" };
    }

    if (parentIdValue && !parentDepartment) {
      return { success: false, error: "Parent department not found or belongs to another organization" };
    }

    if (locationIdValue && !location) {
      return { success: false, error: "Location not found or belongs to another organization" };
    }

    if (costCenterIdValue && !costCenter) {
      return { success: false, error: "Cost center not found or belongs to another organization" };
    }

    const department = await db.department.create({
      data: {
        name: data.name,
        description: data.description || null,
        headId: headIdValue,
        parentId: parentIdValue,
        locationId: locationIdValue,
        costCenterId: costCenterIdValue,
        image: data.image || null,
        banner: data.banner || null,
        settings: data.settings || {},
        organizationId: session.organizationId,
      },
    });

    // If a head is assigned, also add them as a department member with HEAD role
    if (headIdValue) {
      await db.departmentMember.create({
        data: {
          departmentId: department.id,
          memberId: headIdValue,
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

    const headIdValue = data.headId === undefined ? undefined : (!data.headId || data.headId === "" || data.headId === "none" ? null : data.headId);
    const parentIdValue = data.parentId === undefined ? undefined : (!data.parentId || data.parentId === "" || data.parentId === "none" ? null : data.parentId);
    const locationIdValue = data.locationId === undefined ? undefined : (!data.locationId || data.locationId === "" || data.locationId === "none" ? null : data.locationId);
    const costCenterIdValue = data.costCenterId === undefined ? undefined : (!data.costCenterId || data.costCenterId === "" || data.costCenterId === "none" ? null : data.costCenterId);

    if (parentIdValue === id) {
      return { success: false, error: "Department cannot be its own parent" };
    }

    // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Relational Resource Assignment
    // MITIGATION: Validate modified foreign relational IDs against current organizationId before updating.
    // ⚡ Bolt Optimization: Parallelize existing department lookup, duplicate name check, and relational ID validations with Promise.all.
    // Collapses up to 6 sequential blocking database queries into 1 concurrent roundtrip.
    const [oldDept, existing, headMember, parentDepartment, location, costCenter] = await Promise.all([
      db.department.findFirst({
        where: { id, organizationId: session.organizationId },
        select: { headId: true },
      }),
      data.name
        ? db.department.findFirst({
            where: {
              organizationId: session.organizationId,
              name: { equals: data.name, mode: "insensitive" },
              id: { not: id },
            },
          })
        : Promise.resolve(null),
      headIdValue
        ? db.member.findFirst({
            where: { id: headIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
      parentIdValue
        ? db.department.findFirst({
            where: { id: parentIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
      locationIdValue
        ? db.inventoryLocation.findFirst({
            where: { id: locationIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
      costCenterIdValue
        ? db.costCenter.findFirst({
            where: { id: costCenterIdValue, organizationId: session.organizationId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!oldDept) {
      return { success: false, error: "Department not found" };
    }

    if (data.name && existing) {
      return { success: false, error: "A department with this name already exists." };
    }

    if (headIdValue && !headMember) {
      return { success: false, error: "Department head not found or belongs to another organization" };
    }

    if (parentIdValue && !parentDepartment) {
      return { success: false, error: "Parent department not found or belongs to another organization" };
    }

    if (locationIdValue && !location) {
      return { success: false, error: "Location not found or belongs to another organization" };
    }

    if (costCenterIdValue && !costCenter) {
      return { success: false, error: "Cost center not found or belongs to another organization" };
    }

    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: Department model lacks composite unique constraint on [id, organizationId].
    // updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
    const updateResult = await db.department.updateMany({
      where: {
        id,
        organizationId: session.organizationId,
      },
      data: {
        name: data.name,
        description: data.description,
        headId: headIdValue,
        parentId: parentIdValue,
        locationId: locationIdValue,
        costCenterId: costCenterIdValue,
        image: data.image,
        banner: data.banner,
        settings: data.settings,
      },
    });

    if (updateResult.count === 0) {
      return { success: false, error: "Department not found" };
    }

    const department = await db.department.findFirstOrThrow({
      where: { id, organizationId: session.organizationId },
    });

    // If head changed, handle department membership
    if (headIdValue !== undefined && headIdValue !== oldDept?.headId) {
      if (headIdValue) {
        // Upsert the new head as a member with HEAD role
        await db.departmentMember.upsert({
          where: {
            departmentId_memberId: {
              departmentId: id,
              memberId: headIdValue,
            },
          },
          update: { role: "HEAD" },
          create: {
            departmentId: id,
            memberId: headIdValue,
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

    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: Department model lacks composite unique constraint on [id, organizationId].
    // deleteMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
    const deleteResult = await db.department.deleteMany({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (deleteResult.count === 0) {
      return { success: false, error: "Department not found" };
    }

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

    // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Member or Department Access
    // MITIGATION: Verify that both department and member belong to current organizationId.
    const department = await db.department.findFirst({
      where: { id: data.departmentId, organizationId: session.organizationId },
      select: { id: true },
    });
    if (!department) {
      return { success: false, error: "Department not found or belongs to another organization" };
    }

    const memberToAssign = await db.member.findFirst({
      where: { id: data.memberId, organizationId: session.organizationId },
      select: { id: true },
    });
    if (!memberToAssign) {
      return { success: false, error: "Member not found or belongs to another organization" };
    }

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

    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: Verify department ownership through relational organizationId check before updating member.
    const existing = await db.departmentMember.findFirst({
      where: {
        id,
        department: { organizationId: session.organizationId },
      },
      select: { id: true, departmentId: true },
    });

    if (!existing) {
      return { success: false, error: "Department member record not found" };
    }

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

    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: Verify department ownership through relational organizationId check before deletion.
    const existing = await db.departmentMember.findFirst({
      where: {
        id,
        department: { organizationId: session.organizationId },
      },
      select: { id: true, departmentId: true },
    });

    if (!existing) {
      return { success: false, error: "Department member record not found" };
    }

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
    const department = await db.department.findFirst({
      where: { id: departmentId, organizationId: session.organizationId },
      select: { id: true },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

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

    // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Budget Creation
    // MITIGATION: Ensure department belongs to current organizationId before creating budget.
    const department = await db.department.findFirst({
      where: { id: data.departmentId, organizationId: session.organizationId },
      select: { id: true },
    });

    if (!department) {
      return { success: false, error: "Department not found or belongs to another organization" };
    }

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
        await tx.department.updateMany({
          where: { id: data.departmentId, organizationId: session.organizationId },
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
    const session = await checkAdminPermission();

    // THREAT: BOLA/IDOR Vulnerability - Foreign Active Budget Assignment
    // MITIGATION: Verify both department and budget belong to current organizationId.
    const department = await db.department.findFirst({
      where: { id: departmentId, organizationId: session.organizationId },
      select: { id: true },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    if (budgetId) {
      const budget = await db.budget.findFirst({
        where: { id: budgetId, organizationId: session.organizationId, departmentId },
        select: { id: true },
      });

      if (!budget) {
        return { success: false, error: "Budget not found or belongs to another department" };
      }
    }

    const updateResult = await db.department.updateMany({
      where: { id: departmentId, organizationId: session.organizationId },
      data: { activeBudgetId: budgetId },
    });

    if (updateResult.count === 0) {
      return { success: false, error: "Department not found" };
    }

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

    // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Relational Chain Creation
    // MITIGATION: Verify department and all step approvers belong to current organizationId.
    // ⚡ Bolt Optimization: Extract unique approver IDs and parallelize department verification and batched approver membership validation via Promise.all.
    // Collapses O(1 + N) sequential blocking queries to O(1) concurrent database execution.
    const approverIds = Array.from(new Set(data.steps.map(step => step.approverId)));

    const [department, approvers] = await Promise.all([
      db.department.findFirst({
        where: { id: data.departmentId, organizationId: session.organizationId },
        select: { id: true },
      }),
      approverIds.length > 0
        ? db.member.findMany({
            where: {
              id: { in: approverIds },
              organizationId: session.organizationId,
            },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    if (!department) {
      return { success: false, error: "Department not found or belongs to another organization" };
    }

    const validApproverSet = new Set(approvers.map(a => a.id));
    for (const step of data.steps) {
      if (!validApproverSet.has(step.approverId)) {
        return { success: false, error: `Approver member ${step.approverId} not found or belongs to another organization` };
      }
    }

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

    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: PurchaseApprovalChain model lacks composite unique constraint on [id, organizationId].
    // updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
    const updateResult = await db.purchaseApprovalChain.updateMany({
      where: { id, organizationId: session.organizationId },
      data: { isActive },
    });

    if (updateResult.count === 0) {
      return { success: false, error: "Approval chain not found" };
    }

    const chain = await db.purchaseApprovalChain.findFirstOrThrow({
      where: { id, organizationId: session.organizationId },
      select: { departmentId: true },
    });

    if (chain.departmentId) {
      revalidatePath(`/staff/departments/${chain.departmentId}`);
    }
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
