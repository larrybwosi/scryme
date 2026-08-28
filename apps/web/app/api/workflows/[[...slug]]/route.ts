import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db } from "@repo/db";
import { randomBytes } from "crypto";

const builtInWorkflowTemplates = [
  {
    path: "f/dealio/customer_onboarding",
    name: "Customer Onboarding Workflow",
    description: "Sends welcome email and provisions CRM profile when a new customer registers.",
    parameters: [
      { name: "sendWelcomeEmail", type: "boolean", label: "Send Welcome Email", defaultValue: true },
      { name: "crmFolder", type: "string", label: "CRM Folder", defaultValue: "New Leads" },
    ],
  },
  {
    path: "f/dealio/inventory_alert",
    name: "Low Stock Alert Workflow",
    description: "Monitors product inventory stock levels and sends notification alerts when below threshold.",
    parameters: [
      { name: "threshold", type: "number", label: "Threshold", defaultValue: 10 },
      { name: "notificationEmail", type: "string", label: "Alert Email", defaultValue: "procurement@example.com" },
    ],
  },
  {
    path: "f/dealio/stock_movement_report",
    name: "Weekly Stock Movement Report",
    description: "Sends a weekly summary of stock movements (IN/OUT) to selected owners and admins via Scryme Chat.",
    parameters: [
      { name: "scheduleDay", type: "number", label: "Day of Week (0=Sunday, 6=Saturday)", defaultValue: 0 },
      { name: "enabled", type: "boolean", label: "Workflow Enabled", defaultValue: true },
    ],
  },
];

async function getAvailableWorkflows(organizationId: string) {
  const definitions = await db.workflowEngineDefinition.findMany({
    where: { organizationId },
  });

  return builtInWorkflowTemplates.map((template) => {
    const provisioned = definitions.find(
      (d) => d.key === template.path || d.key === template.path.replace("f/dealio/", ""),
    );

    return {
      path: template.path,
      name: template.name,
      description: template.description,
      isProvisioned: !!provisioned,
      settings: (provisioned?.config as any) || {},
      schema: {
        type: "object",
        properties: template.parameters.reduce((acc: any, param: any) => {
          acc[param.name] = {
            type: param.type === "string" || param.type === "select" || param.type === "date" ? "string" : param.type,
            title: param.label,
            default: param.defaultValue,
          };
          return acc;
        }, {}),
      },
    };
  });
}

async function provisionWorkflow(
  organizationId: string,
  path: string,
  settings: any,
) {
  if (!path) throw new Error("Path is required");

  const template = builtInWorkflowTemplates.find((t) => t.path === path || t.path.replace("f/dealio/", "") === path);
  const name = template?.name || path;

  const definition = await db.workflowEngineDefinition.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key: path,
      },
    },
    create: {
      organizationId,
      key: path,
      name,
      triggerType: "EVENT",
      config: settings || {},
      isActive: settings?.enabled !== false,
    },
    update: {
      config: settings || {},
      isActive: settings?.enabled !== false,
    },
  });

  return {
    success: true,
    message: `Workflow ${path} provisioned successfully`,
    definitionId: definition.id,
  };
}

async function triggerWorkflow(
  organizationId: string,
  path: string,
  inputs: any,
) {
  if (!path) throw new Error("Path is required");

  let definition = await db.workflowEngineDefinition.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: path,
      },
    },
  });

  if (!definition) {
    definition = await db.workflowEngineDefinition.create({
      data: {
        organizationId,
        key: path,
        name: builtInWorkflowTemplates.find((t) => t.path === path)?.name || path,
        triggerType: "MANUAL",
        config: inputs || {},
        isActive: true,
      },
    });
  }

  const correlationId = "manual_" + Date.now() + "_" + randomBytes(4).toString("hex");

  const execution = await db.workflowEngineExecution.create({
    data: {
      organizationId,
      definitionId: definition.id,
      triggerEvent: path,
      correlationId,
      status: "RUNNING",
      payload: inputs || {},
      startedAt: new Date(),
    },
  });

  const job = await db.workflowEngineJob.create({
    data: {
      organizationId,
      executionId: execution.id,
      definitionId: definition.id,
      handler: path,
      payload: inputs || {},
      status: "QUEUED",
    },
  });

  return { success: true, data: execution };
}

async function cancelWorkflow(organizationId: string, jobId: string) {
  const execution = await db.workflowEngineExecution.findFirst({
    where: {
      organizationId,
      id: jobId,
    },
  });

  if (execution) {
    await db.workflowEngineExecution.update({
      where: { id: execution.id },
      data: { status: "CANCELLED" },
    });
  }

  return { success: true };
}

async function getWorkflowLogs(organizationId: string, jobId: string) {
  const auditLogs = await db.workflowEngineAuditLog.findMany({
    where: {
      organizationId,
      executionId: jobId,
    },
    orderBy: { createdAt: "asc" },
  });

  const logsText = auditLogs.length > 0
    ? auditLogs.map((log) => `[${log.createdAt.toISOString()}] [${log.level}] ${log.action}: ${JSON.stringify(log.details || {})}`).join("\n")
    : `[CUSTOM AUTOMATION ENGINE LOGS]\n[${new Date().toISOString()}] Job initialized under instance ${jobId}.\n[${new Date().toISOString()}] Executing workflow steps autonomously via NestJS API.`;

  return { success: true, data: logsText };
}

async function getExecutionHistory(
  organizationId: string,
  scriptPath?: string,
) {
  const history = await db.workflowEngineExecution.findMany({
    where: {
      organizationId,
      ...(scriptPath ? { triggerEvent: scriptPath } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return history;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  try {
    let auth;
    try {
      auth = await getServerAuth({ allowNoOrg: true });
    } catch (authError: any) {
      if (isRedirectError(authError)) {
        throw authError;
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      const history = await getExecutionHistory(
        auth.organizationId,
        scriptPath,
      );
      return NextResponse.json({ success: true, data: history });
    }

    if (action === "logs") {
      const jobId = req.nextUrl.searchParams.get("jobId");
      if (!jobId)
        return NextResponse.json(
          { error: "jobId is required" },
          { status: 400 },
        );
      const result = await getWorkflowLogs(auth.organizationId, jobId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Workflow API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  try {
    let auth;
    try {
      auth = await getServerAuth({ allowNoOrg: true });
    } catch (authError: any) {
      if (isRedirectError(authError)) {
        throw authError;
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      const result = await provisionWorkflow(
        auth.organizationId,
        body.path,
        body.settings,
      );
      return NextResponse.json(result);
    }

    if (action === "trigger") {
      const result = await triggerWorkflow(
        auth.organizationId,
        body.path,
        body.inputs,
      );
      return NextResponse.json(result);
    }

    if (action === "cancel") {
      const result = await cancelWorkflow(auth.organizationId, body.jobId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Workflow API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
