import { db } from "@repo/db";
import {
  ApprovalRequestType,
  ApprovalStatus,
  ApprovalRequest,
  Member,
  User,
  ApprovalDecision,
  MemberRole,
} from "@repo/db/client";

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
  if (workflow && workflow.steps.length > 0) {
    const firstStep = workflow.steps[0];
    for (const action of firstStep.actions) {
      if (action.type === "SPECIFIC_MEMBER" && action.specificMemberId) {
        await client.approvalDecision.create({
          data: {
            approvalRequestId: request.id,
            approverId: action.specificMemberId,
            stepNumber: 1,
            status: "PENDING",
          },
        });
      } else if (action.type === "ROLE" && action.approverRole) {
        const members = await client.member.findMany({
          where: {
            organizationId: organizationId,
            role: action.approverRole,
          },
        });
        for (const member of members) {
          await client.approvalDecision.create({
            data: {
              approvalRequestId: request.id,
              approverId: member.id,
              stepNumber: 1,
              status: "PENDING",
            },
          });
        }
      }
    }
  } else {
    // Manual approval by Admins/Owners if no workflow
    const admins = await client.member.findMany({
      where: {
        organizationId: organizationId,
        role: { in: ["ADMIN", "OWNER"] },
      },
    });
    for (const admin of admins) {
      await client.approvalDecision.create({
        data: {
          approvalRequestId: request.id,
          approverId: admin.id,
          stepNumber: 1,
          status: "PENDING",
        },
      });
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
  const request = await db.approvalRequest.findUnique({
    where: { id: data.requestId },
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
        status: data.status as ApprovalStatus,
        comments: data.comments,
        decisionDate: new Date(),
      },
    });
  } else {
    await db.approvalDecision.create({
      data: {
        approvalRequestId: data.requestId,
        approverId: memberId,
        status: data.status as ApprovalStatus,
        comments: data.comments,
        decisionDate: new Date(),
        stepNumber: request.currentStep,
      },
    });
  }

  // Multi-step logic
  let finalStatus: ApprovalStatus = data.status as ApprovalStatus;
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
        const nextWorkflowStep = request.workflow!.steps[nextStep - 1];
        for (const action of nextWorkflowStep.actions) {
          if (action.type === "SPECIFIC_MEMBER" && action.specificMemberId) {
            await db.approvalDecision.create({
              data: {
                approvalRequestId: request.id,
                approverId: action.specificMemberId,
                stepNumber: nextStep,
                status: "PENDING",
              },
            });
          } else if (action.type === "ROLE" && action.approverRole) {
            const members = await db.member.findMany({
              where: {
                organizationId: organizationId,
                role: action.approverRole,
              },
            });
            for (const member of members) {
              await db.approvalDecision.create({
                data: {
                  approvalRequestId: request.id,
                  approverId: member.id,
                  stepNumber: nextStep,
                  status: "PENDING",
                },
              });
            }
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

  return { request, finalStatus, nextStep, originalStep: request.currentStep };
}
