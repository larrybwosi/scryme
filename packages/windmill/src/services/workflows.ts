import { db, ApprovalWorkflow } from '@repo/db';
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
      if (condition.locationId && context.locationId !== condition.locationId) return false;
      return true;
    case 'EXPENSE_CATEGORY':
      if (condition.expenseCategoryId && context.expenseCategoryId !== condition.expenseCategoryId) return false;
      return true;
    default:
      return true;
  }
}

// fallow-ignore-next-line complexity
export async function triggerWorkflow(organizationId: string, event: string, data: WorkflowTriggerData) {
  const workflows = await db.approvalWorkflow.findMany({
    where: {
      organizationId,
      triggerEvent: event,
      isActive: true,
    },
    include: {
      steps: {
        include: {
          conditions: true,
          actions: {
            include: {
              specificMember: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: {
          stepNumber: 'asc'
        }
      }
    }
  });

  for (const workflow of workflows) {
    // If it's a script-based workflow, run it directly
    const settings = workflow.settings as any;
    if (settings?.isScriptWorkflow && settings?.scriptPath) {
        console.log(`Triggering script workflow: ${settings.scriptPath}`);
        await runAutomation({
            organizationId,
            scriptPath: settings.scriptPath,
            data: {
                ...data,
                ...settings.config, // Pass user-configured parameters
                workflowId: workflow.id,
            },
            dealioEventType: `workflow.${event.toLowerCase()}`,
        });
        continue; // Script workflows usually don't have manual steps
    }

    for (const step of workflow.steps) {
      let matches = true;
      if (step.conditions.length > 0) {
        for (const condition of step.conditions) {
          const conditionMatch = evaluateCondition(condition, data);

          if (step.allConditionsMustMatch && !conditionMatch) {
            matches = false;
            break;
          } else if (!step.allConditionsMustMatch && conditionMatch) {
            matches = true;
            break;
          }
        }
      }

      if (!matches) continue;

      // Execute actions
      for (const action of step.actions) {
        switch (action.type) {
          case 'WINDMILL_SCRIPT':
            if (action.windmillScriptPath) {
              await runAutomation({
                organizationId,
                scriptPath: action.windmillScriptPath,
                data: {
                  ...data,
                  workflowId: workflow.id,
                  stepId: step.id
                },
                dealioEventType: `workflow.${event.toLowerCase()}`,
              });
            }
            break;

          case 'NOTIFICATION_ONLY':
            await notificationEngine.notify({
              organizationId,
              templateName: `WORKFLOW_STEP_${step.id}`,
              data: {
                ...data,
                workflowName: workflow.name,
                stepName: step.name
              },
              recipients: {
                memberIds: action.specificMemberId ? [action.specificMemberId] : [],
                roles: action.approverRole ? [action.approverRole] : []
              }
            });
            break;

          default:
            console.warn(`Action type ${action.type} not yet implemented in generic workflow engine`);
            break;
        }
      }
    }
  }
}

export async function getWorkflows(organizationId: string): Promise<ApprovalWorkflow[]> {
  return db.approvalWorkflow.findMany({
    where: { organizationId },
    include: {
      steps: {
        include: {
          conditions: true,
          actions: {
            include: {
              specificMember: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: {
          stepNumber: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function createWorkflow(organizationId: string, data: {
  name: string;
  description?: string;
  triggerEvent?: string;
}): Promise<ApprovalWorkflow> {
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

export async function updateWorkflow(workflowId: string, data: {
  name?: string;
  description?: string;
  triggerEvent?: string;
  isActive?: boolean;
  settings?: any;
}): Promise<ApprovalWorkflow> {
  return db.approvalWorkflow.update({
    where: { id: workflowId },
    data
  });
}

export async function deleteWorkflow(workflowId: string): Promise<ApprovalWorkflow> {
  return db.approvalWorkflow.delete({
    where: { id: workflowId }
  });
}

export async function upsertWorkflowStep(workflowId: string, stepData: {
  id?: string;
  stepNumber: number;
  name: string;
  description?: string;
  slaHours?: number;
  allConditionsMustMatch?: boolean;
}) {
  const { id, ...data } = stepData;

  if (id) {
    return db.approvalWorkflowStep.update({
      where: { id },
      data
    });
  } else {
    return db.approvalWorkflowStep.create({
      data: {
        ...data,
        approvalWorkflowId: workflowId
      }
    });
  }
}

export async function deleteWorkflowStep(stepId: string) {
  return db.approvalWorkflowStep.delete({
    where: { id: stepId }
  });
}

export async function reorderSteps(workflowId: string, stepIds: string[]) {
    return db.$transaction(
        stepIds.map((id, index) =>
            db.approvalWorkflowStep.update({
                where: { id },
                data: { stepNumber: index + 1 }
            })
        )
    );
}

// fallow-ignore-next-line complexity
export async function testWorkflow(organizationId: string, workflowId: string, testData: any) {
  const workflow = await db.approvalWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      steps: {
        include: {
          conditions: true,
          actions: true
        },
        orderBy: {
          stepNumber: 'asc'
        }
      }
    }
  });

  if (!workflow) throw new Error('Workflow not found');
  if (workflow.organizationId !== organizationId) throw new Error('Unauthorized');

  const simulationResults = [];

  for (const step of workflow.steps) {
    let matches = true;
    const stepConditions = [];

    for (const condition of step.conditions) {
      const conditionMatch = evaluateCondition(condition, testData);

      stepConditions.push({
        type: condition.type,
        match: conditionMatch
      });

      if (step.allConditionsMustMatch && !conditionMatch) {
        matches = false;
      } else if (!step.allConditionsMustMatch && conditionMatch) {
        matches = true;
        break;
      }
    }

    if (step.conditions.length > 0 && !step.allConditionsMustMatch) {
        matches = stepConditions.some(c => c.match);
    }

    simulationResults.push({
      stepNumber: step.stepNumber,
      name: step.name,
      executed: matches,
      conditions: stepConditions,
      actions: step.actions.map((a: any) => ({ type: a.type }))
    });

    if (!matches) break;
  }

  return simulationResults;
}

export async function upsertStepCondition(stepId: string, conditionData: {
  id?: string;
  type: ConditionType;
  minAmount?: number;
  maxAmount?: number;
  locationId?: string;
  expenseCategoryId?: string;
}) {
  const { id, ...data } = conditionData;

  if (id) {
    return db.approvalStepCondition.update({
      where: { id },
      data
    });
  } else {
    return db.approvalStepCondition.create({
      data: {
        ...data,
        stepId
      }
    });
  }
}

export async function deleteStepCondition(conditionId: string) {
    return db.approvalStepCondition.delete({
        where: { id: conditionId }
    });
}

export async function upsertStepAction(stepId: string, actionData: {
  id?: string;
  type: ApprovalActionType;
  approverRole?: any;
  specificMemberId?: string;
  windmillScriptPath?: string;
  approvalMode?: ApprovalMode;
}) {
  const { id, ...data } = actionData;

  if (id) {
    return db.approvalStepAction.update({
      where: { id },
      data
    });
  } else {
    return db.approvalStepAction.create({
      data: {
        ...data,
        stepId
      }
    });
  }
}

export async function deleteStepAction(actionId: string) {
    return db.approvalStepAction.delete({
        where: { id: actionId }
    });
}
