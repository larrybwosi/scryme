import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";

// Mock scripts replicated from apps/api/src/v2/workflows/workflows.service.ts
const mockScripts = [
  {
    path: 'f/dealio/customer_onboarding',
    name: 'Customer Onboarding',
    description: 'Sends welcome email and creates a profile in CRM when a new customer is added.',
    schema: {
      type: 'object',
      properties: {
        sendWelcomeEmail: { type: 'boolean', title: 'Send Welcome Email', default: true },
        crmFolder: { type: 'string', title: 'CRM Folder Name', default: 'New Leads' },
      },
    },
  },
  {
    path: 'f/dealio/inventory_alert',
    name: 'Low Stock Alert',
    description: 'Monitors stock levels and notifies the procurement team when items are below threshold.',
    schema: {
      type: 'object',
      properties: {
        threshold: { type: 'number', title: 'Default Threshold', default: 10 },
        notificationEmail: { type: 'string', title: 'Alert Email', default: 'procurement@example.com' },
      },
    },
  },
  {
    path: 'f/dealio/daily_sales_report',
    name: 'Daily Sales Report',
    description: 'Generates and emails a summary of daily sales to the management team.',
    schema: {
      type: 'object',
      properties: {
        recipients: { type: 'string', title: 'Recipient Emails (comma separated)', default: 'admin@example.com' },
        includeCharts: { type: 'boolean', title: 'Include Visual Charts', default: true },
      },
    },
  },
];

async function getAvailableWorkflows(organizationId: string) {
  const config = await db.windmillConfiguration.findUnique({
    where: { organizationId },
  });

  return mockScripts.map(script => ({
    ...script,
    isProvisioned: !!config,
  }));
}

async function provisionWorkflow(organizationId: string, path: string, settings: any) {
  if (!path) throw new Error("Path is required");

  let config = await db.windmillConfiguration.findUnique({
    where: { organizationId },
  });

  if (!config) {
    config = await db.windmillConfiguration.create({
      data: {
        organizationId,
        windmillApiKey: 'simulated_key_' + Math.random().toString(36).substring(7),
        windmillBaseUrl: 'https://windmill.internal',
        workspaceId: 'ws_' + organizationId.substring(0, 8),
        workspaceName: 'Org Workspace',
      },
    });
  }

  return { success: true, message: `Workflow ${path} provisioned successfully`, configId: config.id };
}

async function triggerWorkflow(organizationId: string, path: string, inputs: any) {
  if (!path) throw new Error("Path is required");

  const config = await db.windmillConfiguration.findUnique({
    where: { organizationId },
  });

  if (!config) {
    return { success: false, error: 'Windmill not configured for this organization' };
  }

  const execution = await db.windmillExecution.create({
    data: {
      organizationId,
      configId: config.id,
      jobId: 'job_' + Math.random().toString(36).substring(7),
      scriptPath: path,
      dealioEventType: 'MANUAL_TRIGGER',
      correlationId: 'manual_' + Date.now(),
      status: 'PENDING',
    },
  });

  // In a real production app, this would be handled by a proper background worker or Windmill callback.
  // For the purpose of this task (replicating functionality from apps/api), we keep it as is,
  // but acknowledging that in serverless it might not always finish.
  (async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await db.windmillExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          result: { success: true, triggeredAt: new Date().toISOString(), inputs },
          completedAt: new Date(),
        },
      });
    } catch (e) {
      console.error("Failed to update execution status", e);
    }
  })();

  return { success: true, data: execution };
}

async function getExecutionHistory(organizationId: string, scriptPath?: string) {
  const history = await db.windmillExecution.findMany({
    where: {
      organizationId,
      ...(scriptPath ? { scriptPath } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return history;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const action = slug[0];

    if (action === "available") {
      const workflows = await getAvailableWorkflows(auth.organizationId);
      return NextResponse.json({ success: true, data: workflows });
    }

    if (action === "history") {
      const scriptPath = req.nextUrl.searchParams.get("path") || undefined;
      const history = await getExecutionHistory(auth.organizationId, scriptPath);
      return NextResponse.json({ success: true, data: history });
    }

    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  } catch (error: any) {
    console.error("Workflow API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const action = slug[0];
    const body = await req.json().catch(() => ({}));

    if (action === "provision") {
      const result = await provisionWorkflow(auth.organizationId, body.path, body.settings);
      return NextResponse.json(result);
    }

    if (action === "trigger") {
      const result = await triggerWorkflow(auth.organizationId, body.path, body.inputs);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  } catch (error: any) {
    console.error("Workflow API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
