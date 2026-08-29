import { db as prisma } from "@repo/db";
import { getWindmillClientForOrg } from "./client";
import { WindmillExecutionOptions } from "../types";

/**
 * The primary entry point for triggering automations from Dealio.
 */
export async function runAutomation(options: WindmillExecutionOptions) {
  const {
    organizationId,
    scriptPath,
    data,
    correlationId = crypto.randomUUID(),
  } = options;

  let definition = await (prisma as any).workflowEngineDefinition.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: scriptPath,
      },
    },
  });

  if (!definition) {
    definition = await (prisma as any).workflowEngineDefinition.create({
      data: {
        organizationId,
        key: scriptPath,
        name: scriptPath,
        triggerType: "MANUAL",
        config: data || {},
        isActive: true,
      },
    });
  }

  const execution = await (prisma as any).workflowEngineExecution.create({
    data: {
      organizationId,
      definitionId: definition.id,
      triggerEvent: scriptPath,
      correlationId,
      status: "RUNNING",
      payload: data || {},
      startedAt: new Date(),
    },
  });

  await (prisma as any).workflowEngineJob.create({
    data: {
      organizationId,
      executionId: execution.id,
      definitionId: definition.id,
      handler: scriptPath,
      payload: data || {},
      status: "QUEUED",
    },
  });

  return execution.id;
}
