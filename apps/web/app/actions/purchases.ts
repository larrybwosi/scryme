"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function getPurchases(params: {
  search?: string;
  status?: string;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const where: any = {
    organizationId: auth.organizationId,
  };

  if (params.search) {
    where.OR = [
      { purchaseNumber: { contains: params.search, mode: "insensitive" } },
      { supplier: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  const purchases = await db.purchase.findMany({
    where,
    include: {
      supplier: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return purchases.map((p) => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierName: p.supplier.name,
    amount: Number(p.totalAmount),
    status: p.status,
    date: p.orderDate,
    itemCount: p.items.length,
    // For the UI which expects 'product' and 'category'
    product: p.items[0]?.variant.product.name || "N/A",
    category: p.items[0]?.variant.product.categoryId || "N/A", // Should ideally be category name
    image: p.items[0]?.variant.product.imageUrls[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=" + p.id,
  }));
}

export async function createPurchase(data: {
  supplierId: string;
  items: { variantId: string; quantity: number; unitCost: number }[];
  purchaseNumber: string;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const totalAmount = data.items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);

  const purchase = await db.purchase.create({
    data: {
      organizationId: auth.organizationId,
      memberId: auth.user.id,
      supplierId: data.supplierId,
      purchaseNumber: data.purchaseNumber,
      totalAmount: totalAmount,
      status: "ORDERED",
      items: {
        create: data.items.map((item) => ({
          variantId: item.variantId,
          orderedQuantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })),
      },
    },
  });

  revalidatePath("/purchases");
  return purchase;
}
