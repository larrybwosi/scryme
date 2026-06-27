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
  MemberRole,
} from "@repo/db/client";
import {
  submitForApprovalCore,
  makeApprovalDecisionCore,
} from "@repo/shared/actions/finance/approvals";

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function getApprovalRequests(): Promise<
  (ApprovalRequest & {
    requester: Member & { user: User };
    decisions: (ApprovalDecision & { approver: Member & { user: User } })[];
  })[]
> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  return await db.approvalRequest.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      requester: {
        include: { user: true },
      },
      decisions: {
        include: {
          approver: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitForApproval(
  data: {
    relatedId: string;
    type: ApprovalRequestType;
    amount: number;
    relatedRecordNumber: string;
  },
  tx?: any,
) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
  ]);

  const request = await submitForApprovalCore(
    auth.organizationId,
    auth.memberId,
    data,
    tx,
  );

  revalidatePath("/finance/approvals");

  // Trigger Scryme notifications asynchronously
  if (process.env.PUBLIC_API_URL) {
    fetch(`${process.env.PUBLIC_API_URL}/v2/scryme/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    }).catch(err =>
      console.error("Failed to trigger Scryme notification:", err),
    );
  }

  return request;
}

export async function makeApprovalDecision(data: {
  requestId: string;
  status: "APPROVED" | "REJECTED" | "REQUEST_INFO";
  comments?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const result = await makeApprovalDecisionCore(
    auth.organizationId,
    auth.memberId,
    data,
  );
  const { request, finalStatus, nextStep, originalStep } = result;

  // Update Scryme messages for the step where decision was made
  if (process.env.PUBLIC_API_URL) {
    fetch(`${process.env.PUBLIC_API_URL}/v2/scryme/update-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        memberId: auth.memberId,
        stepNumber: originalStep,
      }),
    }).catch(err => console.error("Failed to update Scryme messages:", err));
  }

  // If moved to next step, notify new approvers
  if (nextStep > originalStep && process.env.PUBLIC_API_URL) {
    fetch(`${process.env.PUBLIC_API_URL}/v2/scryme/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    }).catch(err =>
      console.error("Failed to trigger next step Scryme notification:", err),
    );
  }

  // If final decision or info requested, notify requester
  if (
    (finalStatus === "APPROVED" ||
      finalStatus === "REJECTED" ||
      finalStatus === "REQUEST_INFO") &&
    nextStep === originalStep &&
    process.env.PUBLIC_API_URL
  ) {
    fetch(`${process.env.PUBLIC_API_URL}/v2/scryme/notify-requester`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    }).catch(err =>
      console.error("Failed to notify requester via Scryme:", err),
    );
  }

  revalidatePath("/finance/approvals");
  revalidatePath("/finance/expenses");
  revalidatePath("/finance/purchases");
}
