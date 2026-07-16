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
      windmillConfiguration: true,
      hulyConfiguration: true,
      zitadelConfiguration: true,
      planeConfiguration: true,
      scrymeConfiguration: true,
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return {
    windmill: {
      connected: !!org.windmillConfiguration,
      config: org.windmillConfiguration
        ? {
            ...org.windmillConfiguration,
            windmillApiKey: org.windmillConfiguration.windmillApiKey
              ? "••••••••"
              : null,
            webhookSecret: org.windmillConfiguration.webhookSecret
              ? "••••••••"
              : null,
          }
        : null,
    },
    huly: {
      connected: !!org.hulyConfiguration,
      config: org.hulyConfiguration
        ? {
            ...org.hulyConfiguration,
            apiKey: org.hulyConfiguration.apiKey ? "••••••••" : null,
          }
        : null,
    },
    zitadel: {
      connected: !!org.zitadelConfiguration,
      config: org.zitadelConfiguration,
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

export async function updateWindmillConfig(data: {
  windmillBaseUrl: string;
  windmillApiKey: string;
  webhookSecret?: string;
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.windmillConfiguration.upsert({
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

export async function provisionWindmill() {
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

  const adminApiKey = process.env.WINDMILL_ADMIN_API_KEY;
  if (!adminApiKey) {
    throw new Error(
      "Windmill automatic provisioning is not configured on this server (WINDMILL_ADMIN_API_KEY is missing)."
    );
  }

  const { WindmillTemplateService } = await import("@repo/windmill");

  try {
    await WindmillTemplateService.provisionAndDeploy(
      org.id,
      org.name,
      org.slug
    );
    revalidatePath("/integrations");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to provision Windmill for organization:", error);
    throw new Error(error.message || "Failed to provision Windmill workspace");
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

export async function updateZitadelConfig(data: {
  zitadelOrgId?: string;
  zitadelProjectId?: string;
  zitadelAppId?: string;
}) {
  const context = await getOrganizationContext();
  if (!context?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.zitadelConfiguration.upsert({
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
