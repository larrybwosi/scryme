import { db as prisma } from '@repo/db';
import { getWindmillClientForOrg } from './client';
import { WindmillExecutionOptions } from '../types';

/**
 * The primary entry point for triggering Windmill automations from Dealio.
 */
export async function runAutomation(options: WindmillExecutionOptions) {
  const {
    organizationId,
    scriptPath,
    data,
    correlationId = crypto.randomUUID(),
    callbackUrl
  } = options;

  const config = await prisma.windmillConfiguration.findUnique({
    where: { organizationId },
  });

  if (!config || !config.isActive) {
    throw new Error('Windmill integration is not active for this organization');
  }

  const client = await getWindmillClientForOrg(organizationId);

  // Inject callback info into data if provided
  const executionData = {
    ...data,
    callbackUrl: callbackUrl ?? process.env.WINDMILL_CALLBACK_URL,
    correlationId,
    organizationId,
  };

  const jobId = await client.runScript(scriptPath, executionData);

  // Track execution in Dealio DB for dashboard visibility
  await prisma.windmillExecution.create({
    data: {
      organizationId,
      configId: config.id,
      jobId,
      scriptPath,
      dealioEventType: (data as any).eventType ?? 'manual',
      correlationId,
      status: 'PENDING',
    },
  });

  return jobId;
}
