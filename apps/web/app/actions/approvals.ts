"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import {
  ApprovalRequestType,
  ApprovalStatus,
  ApprovalRequest,
  Member,
  User,
  ApprovalDecision,
  MemberRole
} from "@repo/db/client";

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { organizationId_userId: { organizationId: auth.organizationId, userId: auth.user.id } }
  });

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function getApprovalRequests(): Promise<(ApprovalRequest & {
  requester: Member & { user: User };
  decisions: (ApprovalDecision & { approver: Member & { user: User } })[];
})[]> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  return await db.approvalRequest.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      requester: {
        include: { user: true }
      },
      decisions: {
        include: {
          approver: { include: { user: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitForApproval(data: {
  relatedId: string;
  type: ApprovalRequestType;
  amount: number;
  relatedRecordNumber: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]);

  // 1. Find if there's an active workflow for this type
  const triggerEvent = data.type === "EXPENSE" ? "EXPENSE_CREATED" :
                       data.type === "PURCHASE_ORDER" ? "PURCHASE_ORDER_CREATED" : null;

  const workflow = await db.approvalWorkflow.findFirst({
    where: {
      organizationId: auth.organizationId,
      isActive: true,
      triggerEvent: triggerEvent
    },
    include: {
      steps: {
        orderBy: { stepNumber: "asc" },
        include: {
          conditions: true,
          actions: true
        }
      }
    }
  });

  // If no workflow, create a pending request for manual approval by admins
  const request = await db.approvalRequest.create({
    data: {
      organizationId: auth.organizationId,
      requesterId: auth.user.id,
      relatedId: data.relatedId,
      requestType: data.type,
      amount: data.amount,
      relatedRecordNumber: data.relatedRecordNumber,
      status: "PENDING",
      workflowId: workflow?.id,
    }
  });

  // Update the related record status
  if (data.type === "EXPENSE") {
    await db.expense.update({
      where: { id: data.relatedId },
      data: { status: "PENDING_APPROVAL", approvalRequestId: request.id }
    });
  } else if (data.type === "PURCHASE_ORDER") {
    await db.purchase.update({
      where: { id: data.relatedId },
      data: { status: "PENDING_APPROVAL", approvalRequestId: request.id }
    });
  }

  revalidatePath("/finance/approvals");
  return request;
}

export async function makeApprovalDecision(data: {
  requestId: string;
  status: "APPROVED" | "REJECTED";
  comments?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const request = await db.approvalRequest.findUnique({
    where: { id: data.requestId },
    include: { workflow: { include: { steps: true } } }
  });

  if (!request) throw new Error("Request not found");

  // Record decision
  await db.approvalDecision.create({
    data: {
      approvalRequestId: data.requestId,
      approverId: auth.user.id,
      status: data.status as ApprovalStatus,
      comments: data.comments,
      decisionDate: new Date(),
      stepNumber: request.currentStep
    }
  });

  // Simplified multi-step logic
  await db.approvalRequest.update({
    where: { id: data.requestId },
    data: { status: data.status as ApprovalStatus }
  });

  // Update related record
  if (data.status === "APPROVED") {
    if (request.requestType === "EXPENSE") {
      await db.expense.update({
        where: { id: request.relatedId },
        data: { status: "APPROVED" }
      });
    } else if (request.requestType === "PURCHASE_ORDER") {
      await db.purchase.update({
        where: { id: request.relatedId },
        data: { status: "APPROVED" }
      });
    }
  } else if (data.status === "REJECTED") {
    if (request.requestType === "EXPENSE") {
      await db.expense.update({
        where: { id: request.relatedId },
        data: { status: "REJECTED" }
      });
    } else if (request.requestType === "PURCHASE_ORDER") {
      await db.purchase.update({
        where: { id: request.relatedId },
        data: { status: "REJECTED" }
      });
    }
  }

  revalidatePath("/finance/approvals");
  revalidatePath("/finance/expenses");
  revalidatePath("/finance/purchases");
}
