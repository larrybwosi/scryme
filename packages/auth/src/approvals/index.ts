import { db, Prisma, type PrismaClient } from '@repo/db';
import { ApprovalWorkflowInput, ApprovalWorkflowInputSchema } from '../validations/approval';

export interface WorkflowResult {
  success: boolean;
  message: string;
  workflowId?: string;
  error?: unknown;
}

/**
 * Creates an approval workflow for an organization.
 * Can be used standalone or within an existing Prisma transaction.
 */
export async function createApprovalWorkflow(
  orgId: string,
  workflowData: unknown,
  prismaClient: PrismaClient = db,
  tx?: Prisma.TransactionClient
): Promise<WorkflowResult> {
  // 1. Validate Input Data
  const validationResult = ApprovalWorkflowInputSchema.safeParse(workflowData);
  if (!validationResult.success) {
    console.error('Workflow data validation failed:', validationResult.error);
    return {
      success: false,
      message: 'Invalid workflow data provided.',
      error: validationResult.error.flatten(),
    };
  }
  const validatedData: ApprovalWorkflowInput = validationResult.data;

  try {
    // 2. Define the workflow creation logic
    const createWorkflow = async (client: PrismaClient | Prisma.TransactionClient) => {
      // Create the main workflow record
      const newWorkflow = await client.approvalWorkflow.create({
        data: {
          organizationId: orgId,
          name: validatedData.name,
          description: validatedData.description,
          isActive: validatedData.isActive,
        },
      });

      // Create steps, conditions, and actions
      for (const stepData of validatedData.steps) {
        const newStep = await client.approvalWorkflowStep.create({
          data: {
            approvalWorkflowId: newWorkflow.id,
            stepNumber: stepData.stepNumber,
            name: stepData.name,
            description: stepData.description,
            allConditionsMustMatch: stepData.allConditionsMustMatch,
          },
        });

        // Create conditions for the step
        await client.approvalStepCondition.createMany({
          data: stepData.conditions.map(condition => ({
            stepId: newStep.id,
            type: condition.type,
            minAmount: condition.minAmount,
            maxAmount: condition.maxAmount,
            expenseCategoryId: condition.expenseCategoryId,
            locationId: condition.locationId,
          })),
        });

        // Create actions for the step
        await client.approvalStepAction.createMany({
          data: stepData.actions.map(action => ({
            stepId: newStep.id,
            type: action.type,
            approverRole: action.approverRole,
            specificMemberId: action.specificMemberId,
            approvalMode: action.approvalMode,
          })),
        });
      }

      return newWorkflow;
    };

    // 3. Execute with transaction client if provided, otherwise use a new transaction
    const result = tx
      ? await createWorkflow(tx)
      : await (prismaClient as any).$transaction(createWorkflow);

    return {
      success: true,
      message: `Workflow '${result.name}' created successfully.`,
      workflowId: result.id,
    };
  } catch (error: unknown) {
    console.error('Error creating approval workflow:', error);
    let message = 'Failed to create approval workflow.';
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        message = `A workflow with the name '${validatedData.name}' already exists for this organization.`;
      }
    }
    return { success: false, message, error };
  }
}

/**
 * Updates an existing expense approval workflow info.
 */
export async function updateApprovalWorkflowInfo(
  workflowId: string,
  workflowUpdateData: Partial<Pick<ApprovalWorkflowInput, 'name' | 'description' | 'isActive'>>
): Promise<WorkflowResult> {
  if (!workflowUpdateData.name && !workflowUpdateData.description && workflowUpdateData.isActive === undefined) {
    return { success: false, message: 'No update data provided.' };
  }

  try {
    const updatedWorkflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        name: workflowUpdateData.name,
        description: workflowUpdateData.description,
        isActive: workflowUpdateData.isActive,
      },
    });
    return { success: true, message: `Workflow '${updatedWorkflow.name}' info updated.`, workflowId };
  } catch (error: unknown) {
    console.error(`Error updating workflow info for ${workflowId}:`, error);
    return { success: false, message: 'Failed to update workflow info.', error };
  }
}

/**
 * Sets the currently active expense approval workflow for an organization.
 */
export async function setActiveWorkflow(
  orgId: string,
  workflowId: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    if (workflowId) {
      const workflow = await db.approvalWorkflow.findUnique({
        where: { id: workflowId },
        select: { organizationId: true, isActive: true },
      });
      if (!workflow || workflow.organizationId !== orgId) {
        return { success: false, message: 'Workflow not found or does not belong to the organization.' };
      }
      if (!workflow.isActive) {
        return { success: false, message: 'Cannot set an inactive workflow as active.' };
      }
    }

    await db.organization.update({
      where: { id: orgId },
      data: {
        activeExpenseWorkflowId: workflowId,
      },
    });
    const message = workflowId ? 'Workflow activated successfully.' : 'Expense approval workflow deactivated.';
    return { success: true, message };
  } catch (error) {
    console.error(`Error setting active workflow for Org ${orgId}:`, error);
    return { success: false, message: 'Failed to update active workflow.' };
  }
}

/**
 * Fetches the complete structure of an approval workflow.
 */
export async function getWorkflowDetails(workflowId: string) {
  try {
    return await db.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            conditions: {
              include: { expenseCategory: true, location: true },
            },
            actions: {
              include: { specificMember: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching workflow details for ${workflowId}:`, error);
    return null;
  }
}
