import { db } from '@repo/db';
import { runAutomation } from './service';
import { notificationEngine } from '@repo/notifications';
import { ApprovalActionType, ApprovalMode, ConditionType } from '@repo/db';

export interface WorkflowTriggerData {
  amount?: number;
  locationId?: string;
  expenseCategoryId?: string;
  [key: string]: any;
}

// fallow-ignore-next-line complexity
function evaluateCondition(condition: any, context: any): boolean {
  switch (condition.type) {
    case 'AMOUNT_RANGE':
      const amount = parseFloat(context.amount?.toString() || '0');
      if (condition.minAmount && amount < Number(condition.minAmount)) return false;
      if (condition.maxAmount && amount > Number(condition.maxAmount)) return false;
      return true;

    case 'LOCATION':
      return condition.locationId === context.locationId;

    case 'EXPENSE_CATEGORY':
      return condition.categoryId === context.expenseCategoryId;

    default:
      return true;
  }
}

// fallow-ignore-next-line complexity
export async function triggerWorkflow(organizationId: string, event: string, data: WorkflowTriggerData): Promise<any> {
  const workflows = await db.approvalWorkflow.findMany({
    where: {
      organizationId,
      triggerEvent: event,
      isActive: true,
    },
    include: {
      steps: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  for (const workflow of workflows) {
    // 1. Evaluate workflow-level conditions if any
    // ...

    // 2. Create an Approval Request
    const request = await db.approvalRequest.create({
      data: {
        organizationId,
        workflowId: workflow.id,
        entityId: data.entityId, // The ID of the thing being approved (e.g., Expense ID)
        entityType: data.entityType,
        status: 'PENDING',
        currentStepOrder: 1,
        metadata: data as any,
      },
    });

    // 3. Start the first step
    const firstStep = workflow.steps[0];
    if (firstStep) {
      // Check step conditions
      const conditions = (firstStep.conditions as any[]) || [];
      const pass = conditions.every((c) => evaluateCondition(c, data));

      if (pass) {
        await db.approvalDecision.create({
          data: {
            organizationId,
            requestId: request.id,
            stepId: firstStep.id,
            status: 'PENDING',
          },
        });

        // Notify approvers
        // ...
      } else {
        // Skip this step or auto-approve?
        // For now, let's assume if conditions don't match, we move to next or approve
      }
    }
  }
}

export async function getWorkflows(organizationId: string) {
  return db.approvalWorkflow.findMany({
    where: { organizationId },
    include: {
      steps: {
        include: {
          actions: true,
          conditions: true,
        },
      },
    },
  });
}

export async function createWorkflow(organizationId: string, data: any): Promise<any> {
    return db.approvalWorkflow.create({
        data: {
            organizationId,
            name: data.name,
            description: data.description,
            triggerEvent: data.triggerEvent,
            isActive: true,
        }
    });
}

export async function updateWorkflow(workflowId: string, data: any): Promise<any> {
    return db.approvalWorkflow.update({
        where: { id: workflowId },
        data
    });
}

export async function deleteWorkflow(workflowId: string): Promise<any> {
    return db.approvalWorkflow.delete({
        where: { id: workflowId }
    });
}
