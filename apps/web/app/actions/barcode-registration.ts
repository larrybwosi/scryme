"use server";

import { db, Prisma } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function searchInventoryProducts(query: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  return await db.product.findMany({
    where: {
      organizationId: auth.organizationId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
        { variants: { some: { barcode: { contains: query, mode: "insensitive" } } } },
      ],
    },
    include: {
      variants: true,
    },
    take: 20,
  });
}

export async function updateVariantBarcode(variantId: string, barcode: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) throw new Error("Unauthorized");

  // Verify ownership and existence
  const variant = await db.productVariant.findFirst({
    where: {
      id: variantId,
      product: { organizationId: auth.organizationId },
    },
  });

  if (!variant) {
    throw new Error("Product variant not found or unauthorized");
  }

  // Check uniqueness within organization
  const existing = await db.productVariant.findFirst({
    where: {
      barcode,
      product: { organizationId: auth.organizationId },
      id: { not: variantId },
    },
  });

  if (existing) {
    throw new Error("Barcode is already in use by another product");
  }

  const updated = await db.productVariant.update({
    where: { id: variantId },
    data: { barcode },
  });

  // Audit log
  await db.actionAuditLog.create({
    data: {
      organizationId: auth.organizationId,
      memberId: auth.memberId || "system",
      action: "REGISTER_BARCODE",
      resourceType: "PRODUCT_VARIANT",
      resourceId: variantId,
      approved: true,
      metadata: { barcode },
    },
  });

  revalidatePath("/inventory/products");
  revalidatePath("/inventory/barcodes");

  return updated;
}
