import { db } from "@repo/db";
export async function getOrganizationBySlug(slug: string) {
  return await db.organization.findUnique({ where: { slug }, include: { zitadelConfiguration: true } });
}