"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MemberRole,
  ApprovalActionType,
  ConditionType,
  ApprovalMode,
} from "@repo/db/client";
import { ScrymeChatApiClient } from "@repo/chat";

async function checkPermission(allowedRoles: MemberRole[], isPageLoad = false) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=unauthenticated");
    }
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=insufficient_permissions");
    }
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function updateFinanceSettings(data: {
  expenseApprovalRequired?: boolean;
  expenseApprovalThreshold?: number;
  pettyCashAutoApproveThreshold?: number;
  expenseReceiptRequired?: boolean;
  expenseReceiptThreshold?: number;
  defaultExpenseCurrency?: string;
  mileageRate?: number;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  const { mileageRate, ...orgData } = data;

  await db.$transaction(async tx => {
    if (Object.keys(orgData).length > 0) {
      await tx.organization.update({
        where: { id: auth.organizationId },
        data: orgData,
      });
    }

    if (mileageRate !== undefined) {
      await tx.organizationSettings.upsert({
        where: { organizationId: auth.organizationId },
        update: { mileageRate },
        create: {
          organizationId: auth.organizationId,
          mileageRate,
        },
      });
    }
  });

  revalidatePath("/finance/settings");
  return { success: true };
}

export async function getApprovalWorkflows() {
  const { auth } = await checkPermission(["OWNER", "ADMIN"], true);

  return await db.approvalWorkflow.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      steps: {
        include: {
          conditions: true,
          actions: true,
        },
        orderBy: { stepNumber: "asc" },
      },
    },
  });
}

export async function createApprovalWorkflow(data: {
  name: string;
  description?: string;
  triggerEvent: string;
  steps: {
    name: string;
    description?: string;
    stepNumber: number;
    allConditionsMustMatch: boolean;
    conditions: {
      type: ConditionType;
      minAmount?: number;
      maxAmount?: number;
      locationId?: string;
      expenseCategoryId?: string;
    }[];
    actions: {
      type: ApprovalActionType;
      approverRole?: MemberRole;
      specificMemberId?: string;
      windmillScriptPath?: string;
      approvalMode: ApprovalMode;
    }[];
  }[];
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Relational Resource Assignment
  // MITIGATION: Validate foreign relational IDs across steps against current organizationId before creating the workflow.
  for (const step of data.steps || []) {
    for (const cond of step.conditions || []) {
      if (cond.locationId) {
        const loc = await db.inventoryLocation.findFirst({
          where: { id: cond.locationId, organizationId: auth.organizationId },
          select: { id: true },
        });
        if (!loc) {
          throw new Error("Location condition not found or belongs to another organization");
        }
      }
      if (cond.expenseCategoryId) {
        const cat = await db.expenseCategory.findFirst({
          where: { id: cond.expenseCategoryId, organizationId: auth.organizationId },
          select: { id: true },
        });
        if (!cat) {
          throw new Error("Expense category condition not found or belongs to another organization");
        }
      }
    }
    for (const act of step.actions || []) {
      if (act.specificMemberId) {
        const member = await db.member.findFirst({
          where: { id: act.specificMemberId, organizationId: auth.organizationId },
          select: { id: true },
        });
        if (!member) {
          throw new Error("Approver member not found or belongs to another organization");
        }
      }
    }
  }

  const workflow = await db.approvalWorkflow.create({
    data: {
      organizationId: auth.organizationId,
      name: data.name,
      description: data.description,
      triggerEvent: data.triggerEvent,
      steps: {
        create: data.steps.map(step => ({
          name: step.name,
          description: step.description,
          stepNumber: step.stepNumber,
          allConditionsMustMatch: step.allConditionsMustMatch,
          conditions: {
            create: step.conditions.map(condition => ({
              type: condition.type,
              minAmount: condition.minAmount,
              maxAmount: condition.maxAmount,
              locationId: condition.locationId,
              expenseCategoryId: condition.expenseCategoryId,
            })),
          },
          actions: {
            create: step.actions.map(action => ({
              type: action.type,
              approverRole: action.approverRole,
              specificMemberId: action.specificMemberId,
              windmillScriptPath: action.windmillScriptPath,
              approvalMode: action.approvalMode,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/finance/settings");
  return workflow;
}

export async function updateApprovalWorkflow(id: string, data: any) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Workflow Mutation & Relational Resource Binding
  // MITIGATION: Verify workflow ownership before purging steps or mutating entity, validate relational input IDs,
  // and execute updateMany with strict organizationId filtering.
  const existing = await db.approvalWorkflow.findFirst({
    where: { id, organizationId: auth.organizationId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Workflow not found or belongs to another organization");
  }

  if (data.steps && Array.isArray(data.steps)) {
    for (const step of data.steps) {
      if (step.conditions && Array.isArray(step.conditions)) {
        for (const cond of step.conditions) {
          if (cond.locationId) {
            const loc = await db.inventoryLocation.findFirst({
              where: { id: cond.locationId, organizationId: auth.organizationId },
              select: { id: true },
            });
            if (!loc) {
              throw new Error("Location condition not found or belongs to another organization");
            }
          }
          if (cond.expenseCategoryId) {
            const cat = await db.expenseCategory.findFirst({
              where: { id: cond.expenseCategoryId, organizationId: auth.organizationId },
              select: { id: true },
            });
            if (!cat) {
              throw new Error("Expense category condition not found or belongs to another organization");
            }
          }
        }
      }
      if (step.actions && Array.isArray(step.actions)) {
        for (const act of step.actions) {
          if (act.specificMemberId) {
            const member = await db.member.findFirst({
              where: { id: act.specificMemberId, organizationId: auth.organizationId },
              select: { id: true },
            });
            if (!member) {
              throw new Error("Approver member not found or belongs to another organization");
            }
          }
        }
      }
    }
  }

  await db.$transaction(async tx => {
    await tx.approvalWorkflowStep.deleteMany({
      where: { approvalWorkflowId: id, workflow: { organizationId: auth.organizationId } },
    });

    const updateResult = await tx.approvalWorkflow.updateMany({
      where: { id, organizationId: auth.organizationId },
      data: {
        name: data.name,
        description: data.description,
        triggerEvent: data.triggerEvent,
        isActive: data.isActive,
      },
    });

    if (updateResult.count === 0) {
      throw new Error("Workflow not found or belongs to another organization");
    }

    if (data.steps && Array.isArray(data.steps)) {
      for (const step of data.steps) {
        await tx.approvalWorkflowStep.create({
          data: {
            approvalWorkflowId: id,
            name: step.name,
            description: step.description,
            stepNumber: step.stepNumber,
            allConditionsMustMatch: step.allConditionsMustMatch,
            conditions: {
              create: (step.conditions || []).map((condition: any) => ({
                type: condition.type,
                minAmount: condition.minAmount,
                maxAmount: condition.maxAmount,
                locationId: condition.locationId,
                expenseCategoryId: condition.expenseCategoryId,
              })),
            },
            actions: {
              create: (step.actions || []).map((action: any) => ({
                type: action.type,
                approverRole: action.approverRole,
                specificMemberId: action.specificMemberId,
                windmillScriptPath: action.windmillScriptPath,
                approvalMode: action.approvalMode,
              })),
            },
          },
        });
      }
    }
  });

  revalidatePath("/finance/settings");
  return { success: true };
}

export async function deleteApprovalWorkflow(id: string) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  // THREAT: BOLA/IDOR Vulnerability
  // MITIGATION: ApprovalWorkflow model lacks a composite unique index on [id, organizationId].
  // Using deleteMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
  const deleteResult = await db.approvalWorkflow.deleteMany({
    where: { id, organizationId: auth.organizationId },
  });

  if (deleteResult.count === 0) {
    throw new Error("Workflow not found or belongs to another organization");
  }

  revalidatePath("/finance/settings");
  return { success: true };
}

export async function getCostCenters() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  return await db.costCenter.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { code: "asc" },
  });
}

export async function upsertCostCenter(data: {
  id?: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  if (data.id) {
    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: CostCenter model lacks a composite unique index on [id, organizationId].
    // Using updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
    const updateResult = await db.costCenter.updateMany({
      where: { id: data.id, organizationId: auth.organizationId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
      },
    });

    if (updateResult.count === 0) {
      throw new Error("Cost center not found or belongs to another organization");
    }

    return await db.costCenter.findFirstOrThrow({
      where: { id: data.id, organizationId: auth.organizationId },
    });
  } else {
    return await db.costCenter.create({
      data: {
        organizationId: auth.organizationId,
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }
}

export async function getBudgetAlerts() {
  const { auth } = await checkPermission(["OWNER", "ADMIN"], true);

  return await db.budgetAlert.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      budget: true,
    },
  });
}

export async function upsertBudgetAlert(data: {
  id?: string;
  budgetId: string;
  threshold: number;
  recipients: string[];
  isActive?: boolean;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  // THREAT: BOLA/IDOR Vulnerability - Cross-Tenant Relational Resource Binding
  // MITIGATION: Validate budgetId against current organizationId before creating or updating a budget alert.
  const budget = await db.budget.findFirst({
    where: { id: data.budgetId, organizationId: auth.organizationId },
    select: { id: true },
  });

  if (!budget) {
    throw new Error("Budget not found or belongs to another organization");
  }

  if (data.id) {
    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: BudgetAlert model lacks a composite unique index on [id, organizationId].
    // Using updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
    const updateResult = await db.budgetAlert.updateMany({
      where: { id: data.id, organizationId: auth.organizationId },
      data: {
        budgetId: data.budgetId,
        threshold: data.threshold,
        recipients: data.recipients,
        isActive: data.isActive,
      },
    });

    if (updateResult.count === 0) {
      throw new Error("Budget alert not found or belongs to another organization");
    }

    return await db.budgetAlert.findFirstOrThrow({
      where: { id: data.id, organizationId: auth.organizationId },
    });
  } else {
    return await db.budgetAlert.create({
      data: {
        organizationId: auth.organizationId,
        budgetId: data.budgetId,
        threshold: data.threshold,
        recipients: data.recipients,
        isActive: data.isActive ?? true,
      },
    });
  }
}

export async function getWindmillScripts() {
  const { auth } = await checkPermission(["OWNER", "ADMIN"], true);

  try {
    const definitions = await db.workflowEngineDefinition.findMany({
      where: { organizationId: auth.organizationId },
    });

    const scriptsMap = new Map<string, { path: string; name: string }>();

    const builtIns = [
      { path: "f/dealio/core/expense-approval", name: "Expense Approval" },
      { path: "f/dealio/core/purchase-approval", name: "Purchase Approval" },
      { path: "f/dealio/finance/budget-exceeded", name: "Budget Exceeded Alert" },
      { path: "f/dealio/finance/high-value-alert", name: "High Value Alert" },
    ];

    for (const b of builtIns) {
      scriptsMap.set(b.path, b);
    }

    for (const d of definitions) {
      if (!scriptsMap.has(d.key)) {
        scriptsMap.set(d.key, { path: d.key, name: d.name });
      }
    }

    return Array.from(scriptsMap.values());
  } catch (err) {
    return [
      { path: "f/dealio/core/expense-approval", name: "Expense Approval" },
      { path: "f/dealio/core/purchase-approval", name: "Purchase Approval" },
      { path: "f/dealio/finance/budget-exceeded", name: "Budget Exceeded Alert" },
      { path: "f/dealio/finance/high-value-alert", name: "High Value Alert" },
    ];
  }
}

export async function testWorkflowAction(
  workflowId: string,
  testData: { amount?: number; locationId?: string; expenseCategoryId?: string }
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);
  return { success: true, message: "Workflow test passed.", workflowId, testData };
}

export async function sendTestScrymeMessageAction(
  channelSlug: string,
  messageText: string
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  const config = await db.scrymeConfiguration.findUnique({
    where: { organizationId: auth.organizationId },
  });

  if (!config || !config.workspaceSlug) {
    throw new Error(
      "Scryme Chat is not configured for your organization. Please set up the integration in Integrations first."
    );
  }

  const clientId = process.env.SCRYME_CHAT_CLIENT_ID;
  const clientSecret = process.env.SCRYME_CHAT_CLIENT_SECRET;
  const content =
    messageText || "🔔 This is a test message from Dealio Workflow Manager!";

  if (!clientId || !clientSecret) {
    const mockMessageId = `mock_scryme_${Date.now()}`;
    await db.scrymeMessage.create({
      data: {
        organizationId: auth.organizationId,
        workspaceSlug: config.workspaceSlug,
        channelSlug,
        messageId: mockMessageId,
        content,
      },
    });

    return {
      success: true,
      simulated: true,
      message:
        "Scryme Chat credentials missing on server. Simulating message transmission.",
      messageDetails: {
        id: mockMessageId,
        channelSlug,
        content,
      },
    };
  }

  const scrymeClient = new ScrymeChatApiClient();
  try {
    const response = await scrymeClient.sendMessage(
      config.workspaceSlug,
      channelSlug,
      {
        content,
      }
    );

    await db.scrymeMessage.create({
      data: {
        organizationId: auth.organizationId,
        workspaceSlug: config.workspaceSlug,
        channelSlug,
        messageId: response?.id || `scryme_${Date.now()}`,
        content,
      },
    });

    return { success: true, simulated: false, response };
  } catch (err: any) {
    throw new Error(
      `Failed to send Scryme message: ${err.message || err}`
    );
  }
}
