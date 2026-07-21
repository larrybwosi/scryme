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
import { testWorkflow } from "@repo/windmill";
import { ScrymeChatApiClient } from "@repo/scryme";

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

  // For simplicity in this implementation, we delete and recreate steps
  // In a production environment, you might want to perform more granular updates
  await db.$transaction(async tx => {
    await tx.approvalWorkflowStep.deleteMany({
      where: { approvalWorkflowId: id },
    });

    await tx.approvalWorkflow.update({
      where: { id, organizationId: auth.organizationId },
      data: {
        name: data.name,
        description: data.description,
        triggerEvent: data.triggerEvent,
        isActive: data.isActive,
        steps: {
          create: data.steps.map((step: any) => ({
            name: step.name,
            description: step.description,
            stepNumber: step.stepNumber,
            allConditionsMustMatch: step.allConditionsMustMatch,
            conditions: {
              create: step.conditions.map((condition: any) => ({
                type: condition.type,
                minAmount: condition.minAmount,
                maxAmount: condition.maxAmount,
                locationId: condition.locationId,
                expenseCategoryId: condition.expenseCategoryId,
              })),
            },
            actions: {
              create: step.actions.map((action: any) => ({
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
  });

  revalidatePath("/finance/settings");
  return { success: true };
}

export async function deleteApprovalWorkflow(id: string) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  await db.approvalWorkflow.delete({
    where: { id, organizationId: auth.organizationId },
  });

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
    return await db.costCenter.update({
      where: { id: data.id, organizationId: auth.organizationId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
      },
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

  if (data.id) {
    return await db.budgetAlert.update({
      where: { id: data.id, organizationId: auth.organizationId },
      data: {
        budgetId: data.budgetId,
        threshold: data.threshold,
        recipients: data.recipients,
        isActive: data.isActive,
      },
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

  // This is a placeholder for retrieving windmill scripts
  // In a real implementation, you'd fetch this from the Windmill service or db
  return [
    { path: "f/finance/approve_expense", name: "Approve Expense" },
    { path: "f/finance/notify_slack", name: "Notify Slack" },
    { path: "f/finance/check_fraud", name: "Fraud Check" },
  ];
}

export async function testWorkflowAction(
  workflowId: string,
  testData: { amount?: number; locationId?: string; expenseCategoryId?: string }
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);
  return await testWorkflow(auth.organizationId, workflowId, testData);
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
    // Simulated Mode
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

    // Save to message logs
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
