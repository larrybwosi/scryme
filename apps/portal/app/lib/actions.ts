import { db } from "@repo/db";

export async function getB2BProducts(orgId: string, query?: string) {
  return await db.product.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      ...(query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      } : {})
    },
    include: {
      variants: {
        where: { isActive: true },
        include: {
          priceListItems: {
            where: { isActive: true },
            take: 1
          }
        }
      }
    }
  });
}
