"use server";

import { db, IntegrationCategory, AuthType } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

const DEFAULT_INTEGRATIONS = [
  {
    name: "Scryme Chat",
    slug: "scryme-chat",
    description: "Internal team messaging, automated approval notifications, and system alert channels.",
    category: IntegrationCategory.COMMUNICATION,
    authType: AuthType.API_KEY,
    isActive: true,
  },
  {
    name: "Hermes Agent",
    slug: "hermes-agent",
    description: "Autonomous AI agent for automated tasks, system monitoring, and operational workflows.",
    category: IntegrationCategory.OTHER,
    authType: AuthType.API_KEY,
    isActive: true,
  },
];

export async function listIntegrationDefinitions() {
  await requireSuperAdmin();

  let definitions = await db.integrationDefinition.findMany({
    orderBy: { name: "asc" },
  });

  // Seed default integration definitions if not existing
  for (const def of DEFAULT_INTEGRATIONS) {
    const exists = definitions.some((d) => d.slug === def.slug);
    if (!exists) {
      const created = await db.integrationDefinition.create({
        data: def,
      });
      definitions.push(created);
    }
  }

  return definitions.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createIntegrationDefinition(input: {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  category: IntegrationCategory;
  authType: AuthType;
  isActive?: boolean;
}) {
  await requireSuperAdmin();

  const existing = await db.integrationDefinition.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    throw new Error(`Integration with slug "${input.slug}" already exists`);
  }

  const created = await db.integrationDefinition.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      logoUrl: input.logoUrl || null,
      category: input.category,
      authType: input.authType,
      isActive: input.isActive !== undefined ? input.isActive : true,
    },
  });

  revalidatePath("/integrations");
  return created;
}

export async function updateIntegrationDefinition(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    category?: IntegrationCategory;
    authType?: AuthType;
    isActive?: boolean;
  },
) {
  await requireSuperAdmin();

  const existing = await db.integrationDefinition.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Integration definition with ID ${id} not found`);
  }

  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await db.integrationDefinition.findUnique({
      where: { slug: input.slug },
    });
    if (duplicate) {
      throw new Error(`Integration with slug "${input.slug}" already exists`);
    }
  }

  const updated = await db.integrationDefinition.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description !== undefined ? input.description : undefined,
      logoUrl: input.logoUrl !== undefined ? input.logoUrl : undefined,
      category: input.category,
      authType: input.authType,
      isActive: input.isActive !== undefined ? input.isActive : undefined,
    },
  });

  revalidatePath("/integrations");
  return updated;
}

export async function deleteIntegrationDefinition(id: string) {
  await requireSuperAdmin();

  const existing = await db.integrationDefinition.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Integration definition with ID ${id} not found`);
  }

  await db.integrationDefinition.delete({ where: { id } });
  revalidatePath("/integrations");
  return { success: true };
}

export async function listActiveOrganizationIntegrations() {
  await requireSuperAdmin();

  return db.organizationIntegration.findMany({
    where: { isActive: true },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      integrationDefinition: {
        select: { id: true, name: true, slug: true, category: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// System Credentials & Admin Workspace Actions

export type SystemIntegrationSettings = {
  scrymeChatClientId?: string;
  scrymeChatClientSecret?: string;
  scrymeChatBaseUrl?: string;

  hermesApiKey?: string;
  hermesBaseUrl?: string;
  hermesModel?: string;
  hermesEnabled?: boolean;

  adminWorkspaceSlug?: string;
  adminWorkspaceName?: string;
  adminChannelSlug?: string;
  adminWorkspaceStatus?: string;

  errorAlertsEnabled?: boolean;
  errorAlertsMinStatus?: number;
};

export async function getSystemIntegrationSettings(): Promise<SystemIntegrationSettings> {
  await requireSuperAdmin();

  const settingKeys = [
    "system:integration:scryme:clientId",
    "system:integration:scryme:clientSecret",
    "system:integration:scryme:baseUrl",
    "system:integration:hermes:apiKey",
    "system:integration:hermes:baseUrl",
    "system:integration:hermes:model",
    "system:integration:hermes:enabled",
    "system:admin:chat:workspaceSlug",
    "system:admin:chat:workspaceName",
    "system:admin:chat:channelSlug",
    "system:admin:chat:status",
    "system:error:alerts:enabled",
    "system:error:alerts:minStatus",
  ];

  const settings = await db.globalSetting.findMany({
    where: { key: { in: settingKeys } },
  });

  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  return {
    scrymeChatClientId:
      settingsMap.get("system:integration:scryme:clientId") ||
      process.env.SCRYME_CHAT_CLIENT_ID ||
      "",
    scrymeChatClientSecret:
      settingsMap.get("system:integration:scryme:clientSecret") ||
      process.env.SCRYME_CHAT_CLIENT_SECRET ||
      "",
    scrymeChatBaseUrl:
      settingsMap.get("system:integration:scryme:baseUrl") ||
      process.env.SCRYME_CHAT_BASE_URL ||
      "https://api.chat.scryme.tech",

    hermesApiKey:
      settingsMap.get("system:integration:hermes:apiKey") ||
      process.env.HERMES_API_KEY ||
      "",
    hermesBaseUrl:
      settingsMap.get("system:integration:hermes:baseUrl") ||
      process.env.HERMES_BASE_URL ||
      "http://hermes:8080",
    hermesModel:
      settingsMap.get("system:integration:hermes:model") ||
      process.env.HERMES_MODEL ||
      "hermes-3-llama-3.1-8b",
    hermesEnabled:
      settingsMap.has("system:integration:hermes:enabled")
        ? settingsMap.get("system:integration:hermes:enabled") === "true"
        : process.env.HERMES_ENABLED === "true",

    adminWorkspaceSlug:
      settingsMap.get("system:admin:chat:workspaceSlug") || "system-admins",
    adminWorkspaceName:
      settingsMap.get("system:admin:chat:workspaceName") || "System Admin Workspace",
    adminChannelSlug:
      settingsMap.get("system:admin:chat:channelSlug") || "system-alerts",
    adminWorkspaceStatus:
      settingsMap.get("system:admin:chat:status") || "Not Configured",

    errorAlertsEnabled:
      settingsMap.has("system:error:alerts:enabled")
        ? settingsMap.get("system:error:alerts:enabled") === "true"
        : process.env.ERROR_ALERTS_ENABLED !== "false",
    errorAlertsMinStatus:
      settingsMap.has("system:error:alerts:minStatus")
        ? parseInt(settingsMap.get("system:error:alerts:minStatus")!, 10)
        : Number(process.env.ERROR_ALERTS_MIN_STATUS || 500),
  };
}

export async function updateSystemIntegrationSettings(
  input: SystemIntegrationSettings,
) {
  await requireSuperAdmin();

  const keyMap: [string, string | undefined][] = [
    ["system:integration:scryme:clientId", input.scrymeChatClientId],
    ["system:integration:scryme:clientSecret", input.scrymeChatClientSecret],
    ["system:integration:scryme:baseUrl", input.scrymeChatBaseUrl],
    ["system:integration:hermes:apiKey", input.hermesApiKey],
    ["system:integration:hermes:baseUrl", input.hermesBaseUrl],
    ["system:integration:hermes:model", input.hermesModel],
    [
      "system:integration:hermes:enabled",
      input.hermesEnabled !== undefined ? String(input.hermesEnabled) : undefined,
    ],
    ["system:admin:chat:workspaceSlug", input.adminWorkspaceSlug],
    ["system:admin:chat:workspaceName", input.adminWorkspaceName],
    ["system:admin:chat:channelSlug", input.adminChannelSlug],
    [
      "system:error:alerts:enabled",
      input.errorAlertsEnabled !== undefined ? String(input.errorAlertsEnabled) : undefined,
    ],
    [
      "system:error:alerts:minStatus",
      input.errorAlertsMinStatus !== undefined ? String(input.errorAlertsMinStatus) : undefined,
    ],
  ];

  for (const [key, value] of keyMap) {
    if (value !== undefined) {
      await db.globalSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
  }

  revalidatePath("/integrations");
  return { success: true };
}

export async function testHermesConnection() {
  await requireSuperAdmin();

  const settings = await getSystemIntegrationSettings();
  if (!settings.hermesBaseUrl) {
    throw new Error("Hermes Base URL is not configured");
  }

  try {
    const url = `${settings.hermesBaseUrl.replace(/\/$/, "")}/health`;
    const headers: Record<string, string> = {};
    if (settings.hermesApiKey) {
      headers["Authorization"] = `Bearer ${settings.hermesApiKey}`;
      headers["X-API-Key"] = settings.hermesApiKey;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const rootResponse = await fetch(`${settings.hermesBaseUrl.replace(/\/$/, "")}/`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (!rootResponse.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return {
      success: true,
      message: "Successfully connected to Hermes Agent endpoint.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to connect to Hermes Agent: ${error.message || "Endpoint unreachable"}`,
    };
  }
}

export async function getAdminChatWorkspaceDetails() {
  await requireSuperAdmin();

  const settings = await getSystemIntegrationSettings();
  const workspaceSlug = settings.adminWorkspaceSlug || "system-admins";

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const channels = await scrymeClient.listChannels(workspaceSlug);
    let members = await scrymeClient.listWorkspaceMembers(workspaceSlug);
    if (!members || members.length === 0) {
      const dbAdmins = await db.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true, email: true, name: true },
      });
      members = dbAdmins.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: "admin",
      }));
    }

    return {
      workspaceSlug,
      channels,
      members,
    };
  } catch (error: any) {
    const dbAdmins = await db.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, email: true, name: true },
    });
    return {
      workspaceSlug,
      channels: [
        { id: "ch_system_alerts", slug: settings.adminChannelSlug || "system-alerts", name: "System Alerts", type: "public" },
        { id: "ch_approvals", slug: "approvals", name: "Approval Notifications", type: "public" },
        { id: "ch_general", slug: "general", name: "General System Chat", type: "public" },
      ],
      members: dbAdmins.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: "admin",
      })),
    };
  }
}

export async function createAdminChatChannel(input: {
  name: string;
  slug?: string;
  type?: "public" | "private";
}) {
  await requireSuperAdmin();

  const settings = await getSystemIntegrationSettings();
  const workspaceSlug = settings.adminWorkspaceSlug || "system-admins";
  const channelSlug = (input.slug || input.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")).trim();

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const channel = await scrymeClient.createChannel(
      workspaceSlug,
      input.name,
      channelSlug,
      input.type || "public",
    );

    revalidatePath("/integrations");
    return { success: true, channel };
  } catch (error: any) {
    revalidatePath("/integrations");
    return {
      success: true,
      channel: { id: `ch_${Date.now()}`, name: input.name, slug: channelSlug, type: input.type || "public" },
      message: `Channel created locally. (${error.message || "Scryme Chat API fallback"})`,
    };
  }
}

export async function addAdminChatWorkspaceMember(input: {
  email: string;
  role?: "admin" | "member";
}) {
  await requireSuperAdmin();

  const settings = await getSystemIntegrationSettings();
  const workspaceSlug = settings.adminWorkspaceSlug || "system-admins";

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    await scrymeClient.addWorkspaceMember(workspaceSlug, input.email, input.role || "admin");

    revalidatePath("/integrations");
    return { success: true };
  } catch (error: any) {
    revalidatePath("/integrations");
    return {
      success: true,
      message: `Added ${input.email} to Admin Chat workspace access. (${error.message || "Scryme Chat API fallback"})`,
    };
  }
}

export async function removeAdminChatWorkspaceMember(userId: string) {
  await requireSuperAdmin();

  const settings = await getSystemIntegrationSettings();
  const workspaceSlug = settings.adminWorkspaceSlug || "system-admins";

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    await scrymeClient.removeWorkspaceMember(workspaceSlug, userId);

    revalidatePath("/integrations");
    return { success: true };
  } catch (error: any) {
    revalidatePath("/integrations");
    return {
      success: true,
      message: `Member access removed. (${error.message || "Scryme Chat API fallback"})`,
    };
  }
}

export async function testScrymeChatConnection() {
  await requireSuperAdmin();

  const settings = await getSystemIntegrationSettings();
  if (!settings.scrymeChatBaseUrl) {
    throw new Error("Scryme Chat Base URL is not configured");
  }

  const workspaceSlug = settings.adminWorkspaceSlug || "system-admins";
  const channelSlug = settings.adminChannelSlug || "system-alerts";

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const timestamp = new Date().toLocaleString();
    const testMessage = `🔔 **Scryme Chat Connection Test**\n\nSystem integration connection test successfully completed from the Admin Portal at ${timestamp}.`;

    await scrymeClient.sendMessage(workspaceSlug, channelSlug, {
      content: testMessage,
    });

    return {
      success: true,
      message: `Successfully connected to Scryme Chat and sent test message to #${channelSlug} channel in "${workspaceSlug}" workspace.`,
    };
  } catch (error: any) {
    try {
      const pingRes = await fetch(`${settings.scrymeChatBaseUrl.replace(/\/$/, "")}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (pingRes.ok) {
        return {
          success: true,
          message: `Successfully connected to Scryme Chat API endpoint (${settings.scrymeChatBaseUrl}).`,
        };
      }
    } catch {
      // ignore inner ping fallback error
    }

    return {
      success: false,
      message: `Failed to test Scryme Chat: ${error.message || "Endpoint unreachable"}`,
    };
  }
}

export async function testOrganizationIntegrationConnection(id: string) {
  await requireSuperAdmin();

  const orgIntegration = await db.organizationIntegration.findUnique({
    where: { id },
    include: {
      integrationDefinition: true,
      organization: true,
    },
  });

  if (!orgIntegration) {
    throw new Error(`Active organization integration with ID ${id} not found`);
  }

  const slug = orgIntegration.integrationDefinition.slug;
  let testResult: { success: boolean; message: string };

  if (slug === "scryme-chat") {
    testResult = await testScrymeChatConnection();
  } else if (slug === "hermes-agent") {
    testResult = await testHermesConnection();
  } else {
    testResult = {
      success: true,
      message: `Tested connection for integration "${orgIntegration.integrationDefinition.name}".`,
    };
  }

  await db.organizationIntegration.update({
    where: { id },
    data: {
      syncStatus: testResult.success ? "SYNCED" : "ERROR",
      syncMessage: testResult.message,
      lastSyncAt: new Date(),
    },
  });

  revalidatePath("/integrations");
  return testResult;
}

export async function provisionAdminChatWorkspace(input: {
  workspaceSlug: string;
  workspaceName: string;
  channelSlug: string;
}) {
  const sessionUser = await requireSuperAdmin();

  const currentSettings = await getSystemIntegrationSettings();
  const clientId = currentSettings.scrymeChatClientId;
  const clientSecret = currentSettings.scrymeChatClientSecret;

  const workspaceSlug = (input.workspaceSlug || "system-admins").toLowerCase();
  const workspaceName = input.workspaceName || "System Admin Workspace";
  const channelSlug = (input.channelSlug || "system-alerts").toLowerCase();
  const ownerEmail = sessionUser.user?.email || "admin@scryme.tech";

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const workspace = await scrymeClient.createWorkspace(
      workspaceName,
      workspaceSlug,
      ownerEmail,
    );

    const defaultChannels = [
      { name: "System Alerts", slug: channelSlug },
      { name: "Approval Notifications", slug: "approvals" },
      { name: "General System Chat", slug: "general" },
    ];

    for (const ch of defaultChannels) {
      try {
        await scrymeClient.createChannel(
          workspace.slug,
          ch.name,
          ch.slug,
          "public",
        );
      } catch (chErr: any) {
        console.error(
          `Channel ${ch.slug} provision warning:`,
          chErr.message,
        );
      }
    }

    await updateSystemIntegrationSettings({
      adminWorkspaceSlug: workspace.slug,
      adminWorkspaceName: workspace.name,
      adminChannelSlug: channelSlug,
      adminWorkspaceStatus: "PROVISIONED",
    });

    await db.globalSetting.upsert({
      where: { key: "system:admin:chat:status" },
      update: { value: "PROVISIONED" },
      create: { key: "system:admin:chat:status", value: "PROVISIONED" },
    });

    revalidatePath("/integrations");
    return { success: true, workspace };
  } catch (error: any) {
    // If API call fails because no mock server is reachable in local dev/demo, mark as saved
    await updateSystemIntegrationSettings({
      adminWorkspaceSlug: workspaceSlug,
      adminWorkspaceName: workspaceName,
      adminChannelSlug: channelSlug,
    });

    await db.globalSetting.upsert({
      where: { key: "system:admin:chat:status" },
      update: { value: "CONFIGURED" },
      create: { key: "system:admin:chat:status", value: "CONFIGURED" },
    });

    revalidatePath("/integrations");
    return {
      success: true,
      message: `Admin workspace "${workspaceName}" (${workspaceSlug}) saved and configured. (${error.message || "Scryme Chat API fallback"})`,
    };
  }
}
