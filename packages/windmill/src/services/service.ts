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

  const isFlow = scriptPath.startsWith('flows/');
  let normalizedPath = scriptPath.replace(/^flows\//, '');

  // Legacy path mapping for backward compatibility after reorganization
  const legacyMapping: Record<string, string> = {
    'customer_created': 'crm/customer_created',
    'customer_synced': 'crm/customer_synced',
    'customer-registration-alert': 'crm/customer-registration-alert',
    'admin_notification_optin': 'notifications/admin_notification_optin',
    'discord_sales_report': 'notifications/discord_sales_report',
    'bakery_performance_report': 'reports/bakery_performance_report',
    'report_audit_log': 'reports/report_audit_log',
  };

  if (legacyMapping[normalizedPath]) {
    normalizedPath = legacyMapping[normalizedPath];
  }

  // Ensure the f/dealio/ prefix is present if it's not a legacy absolute path
  if (!normalizedPath.startsWith('f/')) {
    normalizedPath = `f/dealio/${normalizedPath}`;
  }

  const jobId = isFlow
    ? await client.runFlow(normalizedPath, executionData)
    : await client.runScript(normalizedPath, executionData);

  // Track execution in Dealio DB for dashboard visibility
  await prisma.windmillExecution.create({
    data: {
      organizationId,
      configId: config.id,
      jobId,
      scriptPath: normalizedPath,
      dealioEventType: (data as any).eventType ?? options.dealioEventType ?? 'manual',
      correlationId,
      status: 'PENDING',
    },
  });

  return jobId;
}
