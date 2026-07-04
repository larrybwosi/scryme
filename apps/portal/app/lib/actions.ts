import { db } from "@repo/db";
export async function getB2BProducts(orgId: string) {
  return await db.product.findMany({ where: { organizationId: orgId, isActive: true }, include: { variants: { include: { prices: true } } } });
}