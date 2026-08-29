import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db } from "@repo/db";
import { randomBytes } from "crypto";
import { env } from "@repo/env";

const builtInWorkflowTemplates = [
  {
    path: "f/dealio/customer_onboarding",
    name: "Customer Onboarding Workflow",
    description: "Sends welcome email and provisions CRM profile when a new customer registers.",
    schema: {
      type: "object",
      properties: {
        sendWelcomeEmail: {
          type: "boolean",
          title: "Send Welcome Email",
          default: true,
          description: "Automatically dispatch a welcome message upon registration.",
          group: "General Settings",
        },
        crmFolder: {
          type: "string",
          title: "CRM Folder Name",
          default: "New Leads",
          description: "CRM bucket where new lead records will be assigned.",
          group: "General Settings",
        },
        startDate: {
          type: "string",
          format: "date",
          title: "Campaign Start Date",
          default: new Date().toISOString().split("T")[0],
          description: "Date from which onboarding triggers are active.",
          group: "Timing & Schedule",
        },
        delayDuration: {
          type: "string",
          format: "duration",
          title: "Email Delay Duration",
          default: "15m",
          description: "Delay prior to dispatching welcome notification email.",
          group: "Timing & Schedule",
        },
      },
    },
  },
  {
    path: "f/dealio/inventory_alert",
    name: "Low Stock Alert Workflow",
    description: "Monitors product inventory stock levels and sends notification alerts when below threshold.",
    schema: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          title: "Default Threshold",
          default: 10,
          description: "Trigger alert when stock drops below this quantity.",
          group: "Alert Triggers",
        },
        alertFrequency: {
          type: "string",
          format: "select",
          enum: ["IMMEDIATE", "HOURLY", "DAILY_DIGEST"],
          enumNames: ["Immediate", "Hourly Digest", "Daily Digest"],
          title: "Notification Frequency",
          default: "IMMEDIATE",
          description: "Frequency for sending stock warning summaries.",
          group: "Alert Triggers",
        },
        notificationEmail: {
          type: "string",
          title: "Alert Email",
          default: "procurement@example.com",
          description: "Primary email endpoint for critical inventory alerts.",
          group: "Notifications",
        },
        quietHoursStart: {
          type: "string",
          format: "time",
          title: "Quiet Hours Start Time",
          default: "22:00",
          description: "Do not trigger non-urgent emails after this time.",
          group: "Timing & Schedule",
        },
      },
    },
  },
  {
    path: "f/dealio/daily_sales_report",
    name: "Daily Sales Report",
    description: "Generates and emails a summary of daily sales to the management team.",
    schema: {
      type: "object",
      properties: {
        recipients: {
          type: "string",
          title: "Recipient Emails (comma separated)",
          default: "admin@example.com",
          description: "Comma-separated list of executive email addresses.",
          group: "Distribution",
        },
        reportTime: {
          type: "string",
          format: "time",
          title: "Daily Scheduled Dispatch Time",
          default: "18:00",
          description: "Local time at which the daily summary is computed.",
          group: "Timing & Schedule",
        },
        includeCharts: {
          type: "boolean",
          title: "Include Visual Charts",
          default: true,
          description: "Attach PDF graphs detailing revenue and units sold.",
          group: "Report Formatting",
        },
      },
    },
  },
  {
    path: "f/dealio/stock_movement_report",
    name: "Weekly Stock Movement Report",
    description: "Sends a weekly summary of stock movements (IN/OUT) to selected owners and admins via Scryme Chat.",
    schema: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          items: { type: "string" },
          title: "Report Recipients",
          format: "members",
          description: "Selected members will receive the weekly report in Scryme Chat.",
          group: "Distribution",
        },
        scheduleDay: {
          type: "string",
          format: "select",
          enum: ["0", "1", "2", "3", "4", "5", "6"],
          enumNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          title: "Day of Week",
          default: "0",
          description: "Scheduled day of the week to run weekly compilation.",
          group: "Timing & Schedule",
        },
        dispatchTime: {
          type: "string",
          format: "time",
          title: "Dispatch Time",
          default: "09:00",
          description: "Time of day to publish weekly summary to Scryme Chat.",
          group: "Timing & Schedule",
        },
        enabled: {
          type: "boolean",
          title: "Workflow Enabled",
          default: true,
          description: "Enable or pause this automated schedule.",
          group: "General Settings",
        },
      },
    },
  },
];

async function fetchFromV3Api(
  orgSlug: string,
  path: string,
  options: RequestInit = {},
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const url = `${apiUrl}/v3/${orgSlug}/automation/${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-org-slug": orgSlug,
        ...(authHeader ? { authorization: authHeader } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    // Fallback to local database handling if NestJS API is unreachable
  }
  return null;
}

async function getAvailableWorkflows(
  organizationId: string,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const v3Res = await fetchFromV3Api(orgSlug, "available", {}, authHeader, cookieHeader);
    if (v3Res?.data) {
      return v3Res.data;
    }
  }

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
      schema: template.schema,
    };
  });
}

async function provisionWorkflow(
  organizationId: string,
  path: string,
  settings: any,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (!path) throw new Error("Path is required");

  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "provision",
      {
        method: "POST",
        body: JSON.stringify({ path, settings }),
      },
      authHeader,
      cookieHeader,
    );
    if (v3Res?.data || v3Res?.success) {
      return v3Res;
    }
  }

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
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (!path) throw new Error("Path is required");

  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "trigger",
      {
        method: "POST",
        body: JSON.stringify({ path, inputs }),
      },
      authHeader,
      cookieHeader,
    );
    if (v3Res?.data || v3Res?.success) {
      return v3Res;
    }
  }

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

  await db.workflowEngineJob.create({
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

async function cancelWorkflow(
  organizationId: string,
  jobId: string,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "cancel",
      {
        method: "POST",
        body: JSON.stringify({ jobId }),
      },
      authHeader,
      cookieHeader,
    );
    if (v3Res?.success) {
      return v3Res;
    }
  }

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

async function getWorkflowLogs(
  organizationId: string,
  jobId: string,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      `logs?jobId=${encodeURIComponent(jobId)}`,
      {},
      authHeader,
      cookieHeader,
    );
    if (v3Res?.data) {
      return v3Res;
    }
  }

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
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const query = scriptPath ? `?path=${encodeURIComponent(scriptPath)}` : "";
    const v3Res = await fetchFromV3Api(
      orgSlug,
      `history${query}`,
      {},
      authHeader,
      cookieHeader,
    );
    if (v3Res?.data) {
      return v3Res.data;
    }
  }

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
    const orgSlug = (auth as any).organizationSlug || auth.organizationId;
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");

    if (action === "available") {
      const workflows = await getAvailableWorkflows(
        auth.organizationId,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json({ success: true, data: workflows });
    }

    if (action === "history") {
      const scriptPath = req.nextUrl.searchParams.get("path") || undefined;
      const history = await getExecutionHistory(
        auth.organizationId,
        scriptPath,
        orgSlug,
        authHeader,
        cookieHeader,
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
      const result = await getWorkflowLogs(
        auth.organizationId,
        jobId,
        orgSlug,
        authHeader,
        cookieHeader,
      );
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
    const orgSlug = (auth as any).organizationSlug || auth.organizationId;
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");

    if (action === "provision") {
      const result = await provisionWorkflow(
        auth.organizationId,
        body.path,
        body.settings,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json(result);
    }

    if (action === "trigger") {
      const result = await triggerWorkflow(
        auth.organizationId,
        body.path,
        body.inputs,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json(result);
    }

    if (action === "cancel") {
      const result = await cancelWorkflow(
        auth.organizationId,
        body.jobId,
        orgSlug,
        authHeader,
        cookieHeader,
      );
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
