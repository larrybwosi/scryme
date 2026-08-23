import { db } from "@repo/db";
import {
  ApprovalRequestType,
  ApprovalRequest,
  Member,
  User,
  ApprovalDecision,
  MemberRole,
} from "@repo/db";

/**
 * Shared core logic for submitting a request for approval.
 */
export async function submitForApprovalCore(
  organizationId: string,
  memberId: string,
  data: {
    relatedId: string;
    type: ApprovalRequestType;
    amount: number;
    relatedRecordNumber: string;
  },
  tx?: any,
) {
  const client = tx || db;

  // 1. Find if there's an active workflow for this type
  const triggerEvent =
    data.type === "EXPENSE"
      ? "EXPENSE_CREATED"
      : data.type === "PURCHASE_ORDER"
        ? "PURCHASE_ORDER_CREATED"
        : null;

  const workflow = await client.approvalWorkflow.findFirst({
    where: {
      organizationId: organizationId,
      isActive: true,
      triggerEvent: triggerEvent,
    },
    include: {
      steps: {
        orderBy: { stepNumber: "asc" },
        include: {
          conditions: true,
          actions: true,
        },
      },
    },
  });

  // If no workflow, create a pending request for manual approval by admins
  const request = await client.approvalRequest.create({
    data: {
      organizationId: organizationId,
      requesterId: memberId,
      relatedId: data.relatedId,
      requestType: data.type,
      amount: data.amount,
      relatedRecordNumber: data.relatedRecordNumber,
      status: "PENDING",
      workflowId: workflow?.id,
      currentStep: 1,
    },
  });

  // Create initial decisions for the first step if workflow exists
  // ⚡ Bolt Optimization: Batch initial pending approval decisions using createMany to execute in a single O(1) query.
  if (workflow && workflow.steps.length > 0) {
    const firstStep = workflow.steps[0];
    const approverIds = new Set<string>();

    for (const action of firstStep.actions) {
      if (action.type === "SPECIFIC_MEMBER" && action.specificMemberId) {
        approverIds.add(action.specificMemberId);
      } else if (action.type === "ROLE" && action.approverRole) {
        const members = await client.member.findMany({
          where: {
            organizationId: organizationId,
            role: action.approverRole,
          },
          select: { id: true },
        });
        for (const member of members) {
          approverIds.add(member.id);
        }
      }
    }

    if (approverIds.size > 0) {
      const decisionsToCreate = Array.from(approverIds).map((approverId) => ({
        approvalRequestId: request.id,
        approverId,
        stepNumber: 1,
        status: "PENDING",
      }));
      if (typeof client.approvalDecision.createMany === "function") {
        await client.approvalDecision.createMany({
          data: decisionsToCreate,
        });
      } else {
        await Promise.all(
          decisionsToCreate.map((data) => client.approvalDecision.create({ data })),
        );
      }
    }
  } else {
    // Manual approval by Admins/Owners if no workflow
    const admins = await client.member.findMany({
      where: {
        organizationId: organizationId,
        role: { in: ["ADMIN", "OWNER"] },
      },
      select: { id: true },
    });
    if (admins.length > 0) {
      const decisionsToCreate = admins.map((admin) => ({
        approvalRequestId: request.id,
        approverId: admin.id,
        stepNumber: 1,
        status: "PENDING",
      }));
      if (typeof client.approvalDecision.createMany === "function") {
        await client.approvalDecision.createMany({
          data: decisionsToCreate,
        });
      } else {
        await Promise.all(
          decisionsToCreate.map((data) => client.approvalDecision.create({ data })),
        );
      }
    }
  }

  // Update the related record status
  if (data.type === "EXPENSE") {
    await client.expense.update({
      where: { id: data.relatedId },
      data: { status: "PENDING_APPROVAL", approvalRequestId: request.id },
    });
  } else if (data.type === "PURCHASE_ORDER") {
    await client.purchase.update({
      where: { id: data.relatedId },
      data: { status: "PENDING_APPROVAL", approvalRequestId: request.id },
    });
  }

  // Trigger Scryme notification if configured
  if (process.env.PUBLIC_API_URL) {
    const baseUrl = process.env.PUBLIC_API_URL.replace(/\/$/, "");
    fetch(`${baseUrl}/v2/scryme/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    }).catch((err) => console.error("Failed to trigger scryme notification:", err));
  }

  return request;
}

/**
 * Shared core logic for making an approval decision.
 */
export async function makeApprovalDecisionCore(
  organizationId: string,
  memberId: string,
  data: {
    requestId: string;
    status: "APPROVED" | "REJECTED" | "REQUEST_INFO";
    comments?: string;
  },
) {
  // SECURITY (Sentinel): Scope lookup with organizationId using findFirst to prevent IDOR / cross-tenant approvals.
  const request = await db.approvalRequest.findFirst({
    where: { id: data.requestId, organizationId },
    include: {
      workflow: {
        include: {
          steps: {
            orderBy: { stepNumber: "asc" },
            include: { actions: true },
          },
        },
      },
    },
  });

  if (!request) throw new Error("Request not found");

  // Record decision (upsert if it was pre-created)
  const existingDecision = await db.approvalDecision.findFirst({
    where: {
      approvalRequestId: data.requestId,
      approverId: memberId,
      stepNumber: request.currentStep,
    },
  });

  if (existingDecision) {
    await db.approvalDecision.update({
      where: { id: existingDecision.id },
      data: {
        status: data.status as any,
        comments: data.comments,
        decisionDate: new Date(),
      },
    });
  } else {
    await db.approvalDecision.create({
      data: {
        approvalRequestId: data.requestId,
        approverId: memberId,
        status: data.status as any,
        comments: data.comments,
        decisionDate: new Date(),
        stepNumber: request.currentStep,
      },
    });
  }

  // Multi-step logic
  let finalStatus: any = data.status;
  let nextStep = request.currentStep;

  if (data.status === "APPROVED") {
    const currentWorkflowStep = request.workflow?.steps.find(
      (s) => s.stepNumber === request.currentStep,
    );
    const isAllMode = currentWorkflowStep?.actions.some(
      (a) => a.approvalMode === "ALL",
    );

    if (isAllMode) {
      const pendingDecisions = await db.approvalDecision.count({
        where: {
          approvalRequestId: data.requestId,
          stepNumber: request.currentStep,
          status: "PENDING",
        },
      });
      if (pendingDecisions > 0) {
        finalStatus = "PENDING";
      }
    }

    if (finalStatus === "APPROVED") {
      const hasMoreSteps =
        request.workflow &&
        request.workflow.steps.length > request.currentStep;
      if (hasMoreSteps) {
        nextStep = request.currentStep + 1;
        finalStatus = "PENDING";

        // Create decisions for the next step
        // ⚡ Bolt Optimization: Batch approval decisions creation for subsequent steps using createMany in a single O(1) query.
        const nextWorkflowStep = request.workflow!.steps[nextStep - 1];
        const nextApproverIds = new Set<string>();

        for (const action of nextWorkflowStep.actions) {
          if (action.type === "SPECIFIC_MEMBER" && action.specificMemberId) {
            nextApproverIds.add(action.specificMemberId);
          } else if (action.type === "ROLE" && action.approverRole) {
            const members = await db.member.findMany({
              where: {
                organizationId: organizationId,
                role: action.approverRole,
              },
              select: { id: true },
            });
            for (const member of members) {
              nextApproverIds.add(member.id);
            }
          }
        }

        if (nextApproverIds.size > 0) {
          const nextDecisionsToCreate = Array.from(nextApproverIds).map(
            (approverId) => ({
              approvalRequestId: request.id,
              approverId,
              stepNumber: nextStep,
              status: "PENDING",
            }),
          );
          if (typeof db.approvalDecision.createMany === "function") {
            await db.approvalDecision.createMany({
              data: nextDecisionsToCreate,
            });
          } else {
            await Promise.all(
              nextDecisionsToCreate.map((data) =>
                db.approvalDecision.create({ data }),
              ),
            );
          }
        }
      }
    }
  }

  await db.approvalRequest.update({
    where: { id: data.requestId },
    data: {
      status: finalStatus,
      currentStep: nextStep,
    },
  });

  // Update related record if final status is reached
  if (finalStatus === "APPROVED") {
    if (request.requestType === "EXPENSE") {
      await db.expense.update({
        where: { id: request.relatedId },
        data: { status: "APPROVED" },
      });
    } else if (request.requestType === "PURCHASE_ORDER") {
      await db.purchase.update({
        where: { id: request.relatedId },
        data: { status: "APPROVED" },
      });
    }
  } else if (finalStatus === "REJECTED") {
    if (request.requestType === "EXPENSE") {
      await db.expense.update({
        where: { id: request.relatedId },
        data: { status: "REJECTED" },
      });
    } else if (request.requestType === "PURCHASE_ORDER") {
      await db.purchase.update({
        where: { id: request.relatedId },
        data: { status: "REJECTED" },
      });
    }
  }

  const result = { request, finalStatus, nextStep, originalStep: request.currentStep };

  // Trigger Scryme notification updates if configured
  if (process.env.PUBLIC_API_URL) {
    const baseUrl = process.env.PUBLIC_API_URL.replace(/\/$/, "");

    // Update Scryme messages for the current step
    fetch(`${baseUrl}/v2/scryme/update-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        memberId: memberId,
        stepNumber: result.originalStep,
      }),
    }).catch((err) => console.error("Failed to trigger scryme update-messages:", err));

    // If moved to next step, notify new approvers
    if (nextStep > result.originalStep) {
      fetch(`${baseUrl}/v2/scryme/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      }).catch((err) => console.error("Failed to trigger scryme notify for next step:", err));
    }

    // If final decision or info requested, notify requester
    if (
      (finalStatus === "APPROVED" ||
        finalStatus === "REJECTED" ||
        finalStatus === "REQUEST_INFO") &&
      nextStep === result.originalStep
    ) {
      fetch(`${baseUrl}/v2/scryme/notify-requester`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      }).catch((err) => console.error("Failed to trigger scryme notify-requester:", err));
    }
  }

  return result;
}
