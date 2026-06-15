import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db, WindmillExecutionStatus } from "@repo/db";
// @ts-ignore
import {
  WindmillTemplateService,
  runAutomation,
  getWindmillClientForOrg,
} from "@repo/windmill";

async function getAvailableWorkflows(organizationId: string) {
  const [provisionedWorkflows, templates] = await Promise.all([
    db.windmillWorkflow.findMany({
      where: { organizationId },
    }),
    WindmillTemplateService.getTemplates(),
  ]);

  return templates.map((template: any) => {
    // Normalize template path for matching with provisioned workflows
    const normalizedPath = `f/dealio/${template.path}`;
    const provisioned = provisionedWorkflows.find(
      (w: any) => w.path === normalizedPath || w.path === template.path,
    );

    return {
      path: normalizedPath,
      name: template.name,
      description: template.description,
      isProvisioned: !!provisioned,
      settings: provisioned?.settings || {},
      schema: {
        type: "object",
        properties: template.parameters.reduce((acc: any, param: any) => {
          acc[param.name] = {
            type:
              param.type === "string" ||
              param.type === "select" ||
              param.type === "date"
                ? "string"
                : param.type,
            title: param.label,
            description: param.description,
            default: param.defaultValue,
            format: param.type === "date" ? "date" : undefined,
            // Handle 'member' format if it was specified in the template
            ...(param.description?.toLowerCase().includes("member") ||
            param.name.toLowerCase().includes("member") ||
            param.name.toLowerCase().includes("recipient")
              ? { format: "member" }
              : {}),
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

  const templates = await WindmillTemplateService.getTemplates();
  const template = templates.find(
    (t: any) => `f/dealio/${t.path}` === path || t.path === path,
  );

  if (!template) throw new Error("Workflow template not found");

  let config = await db.windmillConfiguration.findUnique({
    where: { organizationId },
  });

  if (!config) {
    throw new Error(
      "Windmill not configured for this organization. Please set up Windmill Configuration first.",
    );
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
      name: template.name,
      description: template.description,
      settings: settings as any,
    },
    update: {
      settings: settings as any,
    },
  });

  return {
    success: true,
    message: `Workflow ${path} provisioned successfully`,
    configId: config.id,
  };
}

async function triggerWorkflow(
  organizationId: string,
  path: string,
  inputs: any,
) {
  if (!path) throw new Error("Path is required");

  const workflow = await db.windmillWorkflow.findUnique({
    where: {
      organizationId_path: {
        organizationId,
        path,
      },
    },
  });

  const mergedInputs = {
    ...((workflow?.settings as any) || {}),
    ...inputs,
  };

  const jobId = await runAutomation({
    organizationId,
    scriptPath: path,
    data: mergedInputs,
    dealioEventType: "MANUAL_TRIGGER",
  });

  const execution = await db.windmillExecution.findUnique({
    where: { jobId },
  });

  return { success: true, data: execution };
}

async function cancelWorkflow(organizationId: string, jobId: string) {
  const client = await getWindmillClientForOrg(organizationId);
  await client.cancelJob(jobId);

  await db.windmillExecution.update({
    where: { jobId },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}

async function getWorkflowLogs(organizationId: string, jobId: string) {
  const client = await getWindmillClientForOrg(organizationId);
  const logs = await client.getJobLogs(jobId);
  return { success: true, data: logs };
}

async function getExecutionHistory(
  organizationId: string,
  scriptPath?: string,
  status?: WindmillExecutionStatus,
) {
  const history = await db.windmillExecution.findMany({
    where: {
      organizationId,
      ...(scriptPath ? { scriptPath } : {}),
      ...(status ? { status } : {}),
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
      const status =
        (req.nextUrl.searchParams.get("status") as WindmillExecutionStatus) ||
        undefined;
      const history = await getExecutionHistory(
        auth.organizationId,
        scriptPath,
        status,
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
    console.error("Workflow API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
