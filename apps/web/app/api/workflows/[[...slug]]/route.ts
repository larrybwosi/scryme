import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";

// Expanded mock scripts with formatting and grouping
const mockScripts = [
  {
    path: 'f/dealio/customer_onboarding',
    name: 'Customer Onboarding',
    description: 'Sends welcome email and creates a profile in CRM when a new customer is added.',
    schema: {
      type: 'object',
      properties: {
        sendWelcomeEmail: { type: 'boolean', title: 'Send Welcome Email', default: true, group: 'Email Configuration' },
        crmFolder: { type: 'string', title: 'CRM Folder Name', default: 'New Leads', group: 'CRM Settings' },
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
        threshold: { type: 'number', title: 'Default Threshold', default: 10, group: 'Alert Thresholds' },
        notificationEmail: {
          type: 'string',
          title: 'Alert Recipient',
          format: 'member',
          description: 'Select a staff member to receive alerts',
          group: 'Notification Settings'
        },
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
        recipients: {
          type: 'string',
          title: 'Recipient Member',
          format: 'member',
          group: 'Distribution'
        },
        includeCharts: { type: 'boolean', title: 'Include Visual Charts', default: true, group: 'Report Content' },
      },
    },
  },
  {
    path: 'f/dealio/mpesa_transaction_alert',
    name: 'M-Pesa Transaction Alert',
    description: 'Real-time alerts for incoming M-Pesa payments above a certain value.',
    schema: {
      type: 'object',
      properties: {
        minAmount: { type: 'number', title: 'Minimum Amount', default: 1000, group: 'Conditions' },
        alertRecipient: {
          type: 'string',
          title: 'Alert Recipient',
          format: 'member',
          group: 'Notification'
        },
      },
    },
  },
  {
    path: 'f/dealio/daily_inventory_summary',
    name: 'Daily Inventory Summary',
    description: 'End-of-day summary of stock movements and current levels.',
    schema: {
      type: 'object',
      properties: {
        summaryRecipient: {
          type: 'string',
          title: 'Summary Recipient',
          format: 'member',
          group: 'Distribution'
        },
        includeStockValuation: { type: 'boolean', title: 'Include Valuation', default: false, group: 'Content' },
      },
    },
  },
  {
    path: 'f/dealio/daily_sales_per_branch',
    name: 'Daily Sales Per Branch',
    description: 'Detailed sales breakdown for each location/branch.',
    schema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          title: 'Recipient',
          format: 'member',
          group: 'Distribution'
        },
      },
    },
  },
  {
    path: 'f/dealio/best_seller_notification',
    name: 'Best Seller Notification',
    description: 'Weekly notification of top performing products.',
    schema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          title: 'Recipient',
          format: 'member',
          group: 'Distribution'
        },
        topCount: { type: 'number', title: 'Number of Products', default: 5, group: 'Settings' },
      },
    },
  },
];

async function getAvailableWorkflows(organizationId: string) {
  const workflows = await db.windmillWorkflow.findMany({
    where: { organizationId },
  });

  return mockScripts.map(script => {
    const provisioned = workflows.find(w => w.path === script.path);
    return {
      ...script,
      isProvisioned: !!provisioned,
      settings: provisioned?.settings || {},
    };
  });
}

async function provisionWorkflow(organizationId: string, path: string, settings: any) {
  if (!path) throw new Error("Path is required");

  const script = mockScripts.find(s => s.path === path);
  if (!script) throw new Error("Workflow script not found");

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

  await db.windmillWorkflow.upsert({
    where: {
      organizationId_path: {
        organizationId,
        path,
      },
    },
    create: {
      organizationId,
      configId: config.id,
      path,
      name: script.name,
      description: script.description,
      settings: settings as any,
    },
    update: {
      settings: settings as any,
    },
  });

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

  // Simulation of background execution
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
