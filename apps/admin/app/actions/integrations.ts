"use server";

import { db, IntegrationCategory, AuthType } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export async function listIntegrationDefinitions() {
  await requireSuperAdmin();

  return db.integrationDefinition.findMany({
    orderBy: { name: "asc" },
  });
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
