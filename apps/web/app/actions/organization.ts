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

  const organization = await db.organization.create({
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

  // Update user's active organization
  const user = await db.user.update({
    where: { id: auth.user.id },
    data: { activeOrganizationId: organization.id },
  });

  revalidatePath("/");
  return organization;
}

export async function checkSlugAvailability(slug: string) {
  const existing = await db.organization.findUnique({
    where: { slug },
  });
  return !existing;
}
