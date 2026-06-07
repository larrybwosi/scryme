"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

/**
 * Creates a new organization for the authenticated user.
 *
 * NOTE: Returning 'any' to avoid portability issues with generated Prisma types in this monorepo structure.
 * The underlying return value is a 'Organization' object.
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  industry: string;
  size: string;
}): Promise<any> {
  const auth = await getServerAuth();
  if (!auth) throw new Error("Unauthorized");

  const organization = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: `${data.industry} - ${data.size}`,
        members: {
          create: {
            userId: auth.user.id,
            role: "OWNER",
          },
        },
      },
    });

    const defaultLocation = await tx.inventoryLocation.create({
      data: {
        name: "Main branch",
        code: `MAIN-${org.slug.toUpperCase()}`,
        locationType: "RETAIL_SHOP",
        isDefault: true,
        organizationId: org.id,
      },
    });

    return tx.organization.update({
      where: { id: org.id },
      data: {
        defaultLocationId: defaultLocation.id,
      },
    });
  });

  // Update user's active organization
  await db.user.update({
    where: { id: auth.user.id },
    data: { activeOrganizationId: organization.id },
  });

  // Clear session cache to reflect the new organization immediately
  try {
    const { getUpstashRedis } = await import("@repo/shared");
    const redis = getUpstashRedis();
    await redis.del(`session-cache:${auth.user.id}`);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }

  revalidatePath("/");
  return organization;
}

export async function checkSlugAvailability(slug: string) {
  const existing = await db.organization.findUnique({
    where: { slug },
  });
  return !existing;
}
