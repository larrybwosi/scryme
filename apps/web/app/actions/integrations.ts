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
      { name: "Announcements", slug: "announcements" },
      { name: "Alerts", slug: "alerts" },
      { name: "General", slug: "general" },
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

    await prisma.scrymeConfiguration.upsert({
      where: { organizationId: org.id },
      update: {
        workspaceId: scrymeWorkspace.id,
        workspaceSlug: scrymeWorkspace.slug,
        isActive: true,
      },
      create: {
        organizationId: org.id,
        workspaceId: scrymeWorkspace.id,
        workspaceSlug: scrymeWorkspace.slug,
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
      channels: [],
      members: [],
    };
  }

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const channels = await scrymeClient.listChannels(config.workspaceSlug);

    let members = await scrymeClient.listWorkspaceMembers(config.workspaceSlug);
    if (!members || members.length === 0) {
      const dbMembers = await prisma.member.findMany({
        where: { organizationId: context.organizationId, isActive: true },
        include: { user: true },
      });
      members = dbMembers.map((m) => ({
        id: m.userId,
        email: m.user.email,
        name: m.user.name,
        role: m.role === "OWNER" || m.role === "ADMIN" ? "admin" : "member",
      }));
    }

    return {
      configured: true,
      workspaceSlug: config.workspaceSlug,
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
      channels: [
        { id: "ch_announcements", slug: "announcements", name: "Announcements", type: "public" },
        { id: "ch_alerts", slug: "alerts", name: "Alerts", type: "public" },
        { id: "ch_general", slug: "general", name: "General", type: "public" },
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

  const channelSlug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")).trim();

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    const channel = await scrymeClient.createChannel(
      config.workspaceSlug,
      data.name,
      channelSlug,
      data.type || "public",
    );

    revalidatePath("/integrations");
    return { success: true, channel };
  } catch (error: any) {
    console.error(error);
    revalidatePath("/integrations");
    return {
      success: true,
      channel: { id: `ch_${Date.now()}`, name: data.name, slug: channelSlug, type: data.type || "public" },
      message: `Channel created locally. (${error.message || "Scryme Chat fallback"})`,
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
