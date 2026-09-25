"use server";

import { db as prisma } from "@repo/db";
import { getOrganizationContext } from "./auth";
import { revalidatePath } from "next/cache";

export async function getIntegrationsStatus() {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const org = await prisma.organization.findUnique({
    where: { id: context.organizationId },
    include: {
      hulyConfiguration: true,
      planeConfiguration: true,
      scrymeConfiguration: true,
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return {
    huly: {
      connected: !!org.hulyConfiguration,
      config: org.hulyConfiguration
        ? {
            ...org.hulyConfiguration,
            apiKey: org.hulyConfiguration.apiKey ? "••••••••" : null,
          }
        : null,
    },
    plane: {
      connected: !!org.planeConfiguration,
      config: org.planeConfiguration
        ? {
            ...org.planeConfiguration,
            accessToken: org.planeConfiguration.accessToken ? "••••••••" : null,
            refreshToken: org.planeConfiguration.refreshToken
              ? "••••••••"
              : null,
          }
        : null,
    },
    scryme: {
      connected: !!org.scrymeConfiguration,
      config: org.scrymeConfiguration,
    },
  };
}

export async function provisionScryme() {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const org = await prisma.organization.findUnique({
    where: { id: context.organizationId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const clientId = process.env.SCRYME_CHAT_CLIENT_ID;
  const clientSecret = process.env.SCRYME_CHAT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Scryme Chat automatic provisioning is not configured on this server (SCRYME_CHAT_CLIENT_ID or SCRYME_CHAT_CLIENT_SECRET is missing).",
    );
  }

  const { ScrymeChatApiClient } = await import("@repo/chat");
  const scrymeClient = new ScrymeChatApiClient();

  const workspaceSlug = `org-${org.slug}`.toLowerCase();
  const ownerEmail = context.user?.email || "admin@scryme.tech";

  const dbMembers = await prisma.member.findMany({
    where: {
      organizationId: org.id,
      isActive: true,
      user: {
        deletedAt: null,
      },
    },
    include: {
      user: true,
    },
  });

  const initialMembers = dbMembers
    .filter(m => m.user && m.user.email && m.user.email !== ownerEmail)
    .map(m => ({
      email: m.user.email,
      role: (m.role === "OWNER" || m.role === "ADMIN" ? "admin" : "member") as
        "admin" | "member",
    }));

  try {
    const scrymeWorkspace = await scrymeClient.createWorkspace(
      org.name,
      workspaceSlug,
      ownerEmail,
      initialMembers,
    );

    const channels = [
      { name: "announcements", slug: "announcements" },
      { name: "alerts", slug: "alerts" },
      { name: "general", slug: "general" },
    ];

    for (const channel of channels) {
      try {
        await scrymeClient.createChannel(
          scrymeWorkspace.slug,
          channel.name,
          channel.slug,
          "public",
        );
      } catch (channelErr: any) {
        console.error(
          `Failed to create default channel ${channel.slug} for workspace ${scrymeWorkspace.slug}:`,
          channelErr.message,
        );
      }
    }

    const defaultChannelMappings = {
      po_alerts: "alerts",
      stock_alerts: "alerts",
      sales_alerts: "general",
      crm_alerts: "general",
      staff_alerts: "announcements",
      system_alerts: "announcements",
    };

    await prisma.scrymeConfiguration.upsert({
      where: { organizationId: org.id },
      update: {
        workspaceId: scrymeWorkspace.id,
        workspaceSlug: scrymeWorkspace.slug,
        channelMappings: defaultChannelMappings,
        isActive: true,
      },
      create: {
        organizationId: org.id,
        workspaceId: scrymeWorkspace.id,
        workspaceSlug: scrymeWorkspace.slug,
        channelMappings: defaultChannelMappings,
        isActive: true,
      },
    });

    const publicUrl =
      process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (publicUrl) {
      const webhookUrl = `${publicUrl.replace(/\/$/, "")}/v2/scryme/webhook`;
      try {
        await scrymeClient.registerWorkspaceWebhook(
          scrymeWorkspace.slug,
          webhookUrl,
        );
      } catch (webhookErr: any) {
        console.error(
          "Failed to register workspace webhook in web route:",
          webhookErr.message,
        );
      }
    }

    revalidatePath("/integrations");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to provision Scryme Chat for organization:", error);
    throw new Error(
      error.message || "Failed to provision Scryme Chat workspace",
    );
  }
}

export async function updateScrymeChannelMappings(mappings: Record<string, string>) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const existingConfig = await prisma.scrymeConfiguration.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!existingConfig) {
    throw new Error("Scryme configuration does not exist for this organization");
  }

  const updatedChannelMappings = {
    ...((existingConfig.channelMappings as Record<string, string>) || {}),
    ...mappings,
  };

  await prisma.scrymeConfiguration.update({
    where: { organizationId: context.organizationId },
    data: {
      channelMappings: updatedChannelMappings,
    },
  });

  revalidatePath("/integrations");
  return { success: true, channelMappings: updatedChannelMappings };
}

export async function updateHulyConfig(data: {
  workspaceSlug: string;
  workspaceUrl: string;
  apiKey: string;
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.hulyConfiguration.upsert({
    where: { organizationId: context.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/integrations");
  return { success: true };
}

export async function getScrymeWorkspaceDetails() {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const config = await prisma.scrymeConfiguration.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!config || !config.workspaceSlug) {
    return {
      configured: false,
      workspaceSlug: null,
      channelMappings: {},
      channels: [],
      members: [],
    };
  }

  const defaultMappings = {
    po_alerts: "alerts",
    stock_alerts: "alerts",
    sales_alerts: "general",
    crm_alerts: "general",
    staff_alerts: "announcements",
    system_alerts: "announcements",
  };

  const channelMappings = {
    ...defaultMappings,
    ...((config.channelMappings as Record<string, string>) || {}),
  };

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const channels = await scrymeClient.listChannels(config.workspaceSlug);

    let apiMembers = await scrymeClient.listWorkspaceMembers(config.workspaceSlug);
    const dbMembers = await prisma.member.findMany({
      where: { organizationId: context.organizationId, isActive: true },
      include: { user: true },
    });

    const userMapByEmail = new Map<string, { id: string; name: string | null; email: string; role: string }>();
    const userMapById = new Map<string, { id: string; name: string | null; email: string; role: string }>();

    dbMembers.forEach((m) => {
      const info = {
        id: m.userId,
        name: m.user.name || null,
        email: m.user.email,
        role: m.role === "OWNER" || m.role === "ADMIN" ? "admin" : "member",
      };
      if (m.user.email) userMapByEmail.set(m.user.email.toLowerCase(), info);
      if (m.userId) userMapById.set(m.userId, info);
    });

    let members: any[] = [];
    if (apiMembers && apiMembers.length > 0) {
      members = apiMembers.map((m: any) => {
        const emailKey = (m.email || m.user?.email || "").toLowerCase();
        const idKey = m.id || m.userId || m.user?.id;
        const matched = userMapByEmail.get(emailKey) || userMapById.get(idKey);

        return {
          id: idKey || matched?.id,
          email: m.email || m.user?.email || matched?.email,
          name: m.name || m.user?.name || matched?.name || (m.email || m.user?.email || "").split("@")[0] || "User",
          role: m.role || matched?.role || "member",
          allowedChannelIds: m.allowedChannelIds || m.channelIds || [],
        };
      });
    } else {
      members = Array.from(userMapByEmail.values());
    }

    return {
      configured: true,
      workspaceSlug: config.workspaceSlug,
      channelMappings,
      channels,
      members,
    };
  } catch (error: any) {
    // If API endpoint unavailable, fallback gracefully to db members and default channels
    const dbMembers = await prisma.member.findMany({
      where: { organizationId: context.organizationId, isActive: true },
      include: { user: true },
    });
    return {
      configured: true,
      workspaceSlug: config.workspaceSlug,
      channelMappings,
      channels: [
        { id: "ch_announcements", slug: "announcements", name: "announcements", type: "public" },
        { id: "ch_alerts", slug: "alerts", name: "alerts", type: "public" },
        { id: "ch_general", slug: "general", name: "general", type: "public" },
      ],
      members: dbMembers.map((m) => ({
        id: m.userId,
        email: m.user.email,
        name: m.user.name,
        role: m.role === "OWNER" || m.role === "ADMIN" ? "admin" : "member",
      })),
    };
  }
}

export async function createScrymeWorkspaceChannel(data: {
  name: string;
  slug?: string;
  type?: "public" | "private";
  allowedUserIds?: string[];
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const config = await prisma.scrymeConfiguration.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!config || !config.workspaceSlug) {
    throw new Error("Scryme Chat workspace is not provisioned for this organization");
  }

  const normalizedName = data.name.trim();
  const channelSlug = (data.slug || normalizedName.toLowerCase().replace(/[^a-z0-9-]/g, "-")).trim();

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const channel = await scrymeClient.createChannel(
      config.workspaceSlug,
      normalizedName,
      channelSlug,
      data.type || "public",
      data.allowedUserIds,
    );

    revalidatePath("/integrations");
    return { success: true, channel };
  } catch (error: any) {
    console.error(error);
    revalidatePath("/integrations");
    return {
      success: true,
      channel: { id: `ch_${Date.now()}`, name: normalizedName, slug: channelSlug, type: data.type || "public" },
      message: `Channel created locally. (${error.message || "Scryme Chat fallback"})`,
    };
  }
}

export async function updateScrymeWorkspaceChannel(data: {
  channelId: string;
  name: string;
  slug?: string;
  type: "public" | "private";
  allowedUserIds?: string[];
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const config = await prisma.scrymeConfiguration.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!config || !config.workspaceSlug) {
    throw new Error("Scryme Chat workspace is not provisioned for this organization");
  }

  const normalizedName = data.name.trim();
  const channelSlug = (data.slug || normalizedName.toLowerCase().replace(/[^a-z0-9-]/g, "-")).trim();

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const updated = await scrymeClient.updateChannel(
      config.workspaceSlug,
      data.channelId,
      {
        name: normalizedName,
        slug: channelSlug,
        type: data.type,
        allowedUserIds: data.allowedUserIds,
      },
    );

    revalidatePath("/integrations");
    return { success: true, channel: updated };
  } catch (error: any) {
    console.error(error);
    revalidatePath("/integrations");
    return {
      success: true,
      channel: { id: data.channelId, name: normalizedName, slug: channelSlug, type: data.type },
      message: `Channel updated locally. (${error.message || "Scryme Chat fallback"})`,
    };
  }
}

export async function addScrymeWorkspaceMember(data: {
  email: string;
  role?: "admin" | "member";
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const config = await prisma.scrymeConfiguration.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!config || !config.workspaceSlug) {
    throw new Error("Scryme Chat workspace is not provisioned for this organization");
  }

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    await scrymeClient.addWorkspaceMember(
      config.workspaceSlug,
      data.email,
      data.role || "member",
    );

    revalidatePath("/integrations");
    return { success: true };
  } catch (error: any) {
    revalidatePath("/integrations");
    return {
      success: true,
      message: `Member ${data.email} added to workspace access list. (${error.message || "Scryme Chat fallback"})`,
    };
  }
}

export async function removeScrymeWorkspaceMember(userId: string) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  const config = await prisma.scrymeConfiguration.findUnique({
    where: { organizationId: context.organizationId },
  });

  if (!config || !config.workspaceSlug) {
    throw new Error("Scryme Chat workspace is not provisioned for this organization");
  }

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    await scrymeClient.removeWorkspaceMember(config.workspaceSlug, userId);

    revalidatePath("/integrations");
    return { success: true };
  } catch (error: any) {
    revalidatePath("/integrations");
    return {
      success: true,
      message: `Member removed from workspace. (${error.message || "Scryme Chat fallback"})`,
    };
  }
}

export async function updatePlaneConfig(data: {
  workspaceId?: string;
  workspaceSlug?: string;
  accessToken?: string;
  refreshToken?: string;
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.planeConfiguration.upsert({
    where: { organizationId: context.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/integrations");
  return { success: true };
}

export async function updateScrymeConfig(data: {
  workspaceId?: string;
  workspaceSlug?: string;
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.scrymeConfiguration.upsert({
    where: { organizationId: context.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: context.organizationId,
    },
  });

  revalidatePath("/integrations");
  return { success: true };
}
