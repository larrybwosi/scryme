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
          default: "",
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
          default: "",
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

  const builtinPaths = new Set(builtInWorkflowTemplates.map((t) => t.path));

  const builtinItems = builtInWorkflowTemplates.map((template) => {
    const provisioned = definitions.find(
      (d) => d.key === template.path || d.key === template.path.replace("f/dealio/", ""),
    );

    return {
      path: template.path,
      key: template.path.replace("f/dealio/", ""),
      name: template.name,
      description: template.description,
      isProvisioned: !!provisioned,
      settings: (provisioned?.config as any) || {},
      schema: template.schema,
    };
  });

  const customItems = definitions
    .filter((d) => !builtinPaths.has(d.key) && !builtInWorkflowTemplates.some((t) => t.path.replace("f/dealio/", "") === d.key))
    .map((d) => ({
      path: d.key,
      key: d.key,
      name: d.name,
      description: d.description || "Custom enterprise workflow automation.",
      isProvisioned: true,
      settings: (d.config as any) || {},
      schema: {
        type: "object",
        properties: {
          enabled: { type: "boolean", title: "Enabled", default: d.isActive },
        },
      },
    }));

  return [...builtinItems, ...customItems];
}

async function getWorkflowDefinitions(
  organizationId: string,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const v3Res = await fetchFromV3Api(orgSlug, "definitions", {}, authHeader, cookieHeader);
    if (v3Res?.data) {
      return v3Res.data;
    }
  }

  return db.workflowEngineDefinition.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

async function createWorkflowDefinition(
  organizationId: string,
  key: string,
  name: string,
  description?: string,
  triggerType?: string,
  config?: any,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "definitions",
      {
        method: "POST",
        body: JSON.stringify({ key, name, description, triggerType, config }),
      },
      authHeader,
      cookieHeader,
    );
    if (v3Res?.data || v3Res?.success) {
      return v3Res;
    }
  }

  const definition = await db.workflowEngineDefinition.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key,
      },
    },
    create: {
      organizationId,
      key,
      name,
      description: description || "Custom enterprise workflow automation",
      triggerType: (triggerType as any) || "EVENT",
      config: config || {},
      isActive: true,
    },
    update: {
      name,
      description: description || "Custom enterprise workflow automation",
      triggerType: (triggerType as any) || "EVENT",
      config: config || {},
      isActive: true,
    },
  });

  return { success: true, data: definition };
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

  const existing = await db.workflowEngineDefinition.findFirst({
    where: {
      organizationId,
      OR: [
        { key: path },
        { key: path.replace(/^f\/dealio\//, "") },
      ],
    },
  });

  const targetKey = existing?.key || path;

  const definition = await db.workflowEngineDefinition.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key: targetKey,
      },
    },
    create: {
      organizationId,
      key: targetKey,
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

  let definition = await db.workflowEngineDefinition.findFirst({
    where: {
      organizationId,
      OR: [
        { key: path },
        { key: path.replace(/^f\/dealio\//, "") },
      ],
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

  const job = await db.workflowEngineJob.findFirst({
    where: {
      organizationId,
      id: jobId,
    },
  });

  const executionId = job?.executionId || jobId;

  const execution = await db.workflowEngineExecution.findFirst({
    where: {
      organizationId,
      id: executionId,
    },
  });

  if (execution) {
    await db.workflowEngineExecution.update({
      where: { id: execution.id },
      data: { status: "CANCELLED", completedAt: new Date() },
    });

    await db.workflowEngineJob.updateMany({
      where: {
        organizationId,
        executionId: execution.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      data: {
        status: "CANCELLED",
        lockedBy: null,
        lockedAt: null,
      },
    });
  }

  return { success: true, executionId, jobId: job?.id };
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

  const job = await db.workflowEngineJob.findFirst({
    where: {
      organizationId,
      id: jobId,
    },
  });

  const executionId = job?.executionId || jobId;

  const auditLogs = await db.workflowEngineAuditLog.findMany({
    where: {
      organizationId,
      executionId,
    },
    orderBy: { createdAt: "asc" },
    take: 1000,
  });

  const logsText =
    auditLogs.length > 0
      ? auditLogs
          .map(
            (log) =>
              `[${log.createdAt.toISOString()}] [${log.level}] ${log.action}: ${JSON.stringify(log.details || {})}`,
          )
          .join("\n")
      : `[CUSTOM AUTOMATION ENGINE LOGS]\n[${new Date().toISOString()}] No audit records found for instance ${jobId}.`;

  return { success: true, data: logsText, executionId, jobId: job?.id };
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
    include: {
      jobs: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          attempts: true,
          maxAttempts: true,
          lastError: true,
          nextRunAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return history.map((execution) => {
    const primaryJob = execution.jobs?.[0];
    return {
      id: execution.id,
      jobId: primaryJob?.id || null,
      jobStatus: primaryJob?.status || null,
      status: execution.status,
      correlationId: execution.correlationId,
      triggerEvent: execution.triggerEvent,
      createdAt: execution.createdAt,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      nextRunAt: primaryJob?.nextRunAt || null,
      error: execution.error,
      result: execution.result,
      payload: execution.payload,
      jobs: execution.jobs || [],
    };
  });
}


async function simulateWorkflow(
  organizationId: string,
  path: string,
  inputs: any,
  config?: any,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "simulate",
      {
        method: "POST",
        body: JSON.stringify({ path, key: path, inputs, config }),
      },
      authHeader,
      cookieHeader,
    );
    if (v3Res?.steps || v3Res?.data?.steps) {
      return { success: true, data: v3Res.data || v3Res };
    }

    if (v3Res && (v3Res.message || v3Res.error)) {
      throw new Error(v3Res.message || v3Res.error);
    }
  }

  throw new Error(
    "The workflow simulation API is unavailable. Start the API service and try again.",
  );
}

async function replayWorkflow(
  organizationId: string,
  executionId: string,
  overridePayload?: any,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (!executionId) throw new Error("executionId is required for replay");

  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "replay",
      {
        method: "POST",
        body: JSON.stringify({ executionId, overridePayload }),
      },
      authHeader,
      cookieHeader,
    );
    if (v3Res?.data || v3Res?.success) {
      return v3Res;
    }
  }

  const existing = await db.workflowEngineExecution.findFirst({
    where: { id: executionId, organizationId },
  });

  if (!existing) {
    throw new Error(`Execution ${executionId} not found.`);
  }

  return triggerWorkflow(
    organizationId,
    existing.triggerEvent,
    overridePayload || existing.payload || {},
    orgSlug,
    authHeader,
    cookieHeader,
  );
}

async function getDeadLetterJobs(
  organizationId: string,
  limit: number | undefined,
  offset: number | undefined,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (orgSlug) {
    const query = new URLSearchParams();
    if (limit !== undefined) query.set("limit", String(limit));
    if (offset !== undefined) query.set("offset", String(offset));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const v3Res = await fetchFromV3Api(
      orgSlug,
      `dead-letter${suffix}`,
      {},
      authHeader,
      cookieHeader,
    );
    if (Array.isArray(v3Res?.data)) {
      return v3Res.data;
    }
  }

  return db.workflowEngineJob.findMany({
    where: {
      organizationId,
      status: "FAILED",
    },
    include: {
      execution: true,
      definition: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit ?? 50,
    skip: offset ?? 0,
  });
}

async function retryWorkflowJob(
  organizationId: string,
  jobId: string,
  orgSlug?: string,
  authHeader?: string | null,
  cookieHeader?: string | null,
) {
  if (!jobId) throw new Error("jobId is required");

  if (orgSlug) {
    const v3Res = await fetchFromV3Api(
      orgSlug,
      "jobs/retry",
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

  const job = await db.workflowEngineJob.findFirst({
    where: { organizationId, id: jobId },
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found.`);
  }

  if (job.status !== "FAILED") {
    throw new Error(`Job ${jobId} is ${job.status}. Only failed jobs can be retried.`);
  }

  const requeued = await db.workflowEngineJob.update({
    where: { id: job.id },
    data: {
      status: "QUEUED",
      attempts: 0,
      nextRunAt: new Date(),
      lastError: null,
      processedAt: null,
      lockedBy: null,
      lockedAt: null,
    },
  });

  await db.workflowEngineExecution.updateMany({
    where: {
      id: job.executionId,
      status: { notIn: ["CANCELLED"] },
    },
    data: {
      status: "RUNNING",
      error: null,
      completedAt: null,
    },
  });

  return { success: true, job: requeued };
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

    if (action === "definitions") {
      const definitions = await getWorkflowDefinitions(
        auth.organizationId,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json({ success: true, data: definitions });
    }

    if (action === "history") {
      const scriptPath = req.nextUrl.searchParams.get("path") || undefined;
      const limitParam = req.nextUrl.searchParams.get("limit");
      const offsetParam = req.nextUrl.searchParams.get("offset");
      const history = await getExecutionHistory(
        auth.organizationId,
        scriptPath,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      const limit = limitParam ? Number(limitParam) : undefined;
      const offset = offsetParam ? Number(offsetParam) : undefined;
      const sliced =
        limit !== undefined || offset !== undefined
          ? history.slice(
              Number.isFinite(offset) && offset ? offset : 0,
              (Number.isFinite(offset) && offset ? offset : 0) +
                (Number.isFinite(limit) && limit ? limit : history.length),
            )
          : history;
      return NextResponse.json({ success: true, data: sliced });
    }

    if (action === "dead-letter") {
      const limit = Number(req.nextUrl.searchParams.get("limit") || "");
      const offset = Number(req.nextUrl.searchParams.get("offset") || "");
      const jobs = await getDeadLetterJobs(
        auth.organizationId,
        Number.isFinite(limit) && limit > 0 ? limit : undefined,
        Number.isFinite(offset) && offset >= 0 ? offset : undefined,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json({ success: true, data: jobs });
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

    if (action === "definitions") {
      const result = await createWorkflowDefinition(
        auth.organizationId,
        body.key || body.path,
        body.name,
        body.description,
        body.triggerType,
        body.config,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json(result);
    }

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

    if (action === "simulate") {
      const result = await simulateWorkflow(
        auth.organizationId,
        body.path || body.key,
        body.inputs || body.payload || {},
        body.config,
        orgSlug,
        authHeader,
        cookieHeader,
      );
      return NextResponse.json(result);
    }

    if (action === "replay") {
      const result = await replayWorkflow(
        auth.organizationId,
        body.executionId,
        body.overridePayload,
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

    if (action === "retry" || action === "jobs/retry") {
      const result = await retryWorkflowJob(
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
