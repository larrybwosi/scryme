"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { Purchase, Supplier, MemberRole } from "@repo/db/client";

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { organizationId_userId: { organizationId: auth.organizationId, userId: auth.user.id } }
  });

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function getPurchases(params: {
  search?: string;
  status?: string;
}): Promise<any[]> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

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
    product: p.items[0]?.variant.product.name || "N/A",
    category: p.items[0]?.variant.product.categoryId || "N/A",
    image: p.items[0]?.variant.product.imageUrls[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=" + p.id,
  }));
}

export async function createPurchase(data: {
  supplierId: string;
  items: { variantId: string; quantity: number; unitCost: number }[];
  purchaseNumber: string;
}): Promise<any> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

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

  revalidatePath("/finance/purchases");
  return purchase;
}

export async function updatePurchaseStatus(id: string, status: any): Promise<any> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const purchase = await db.purchase.update({
    where: { id, organizationId: auth.organizationId },
    data: { status },
  });

  revalidatePath("/finance/purchases");
  return purchase;
}

export async function createPurchasePayment(data: {
  purchaseId: string;
  amount: number;
  paymentMethod: any;
  reference?: string;
}): Promise<any> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const payment = await db.purchasePayment.create({
    data: {
      purchaseId: data.purchaseId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      memberId: auth.user.id,
    },
  });

  const purchase = await db.purchase.findUnique({
    where: { id: data.purchaseId },
    include: { payments: true }
  });

  if (purchase) {
    const totalPaid = purchase.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    let paymentStatus: any = "PARTIALLY_PAID";
    if (totalPaid >= Number(purchase.totalAmount)) {
      paymentStatus = "PAID";
    }

    await db.purchase.update({
      where: { id: data.purchaseId },
      data: {
        paidAmount: totalPaid,
        paymentStatus: paymentStatus
      }
    });
  }

  revalidatePath("/finance/purchases");
  return payment;
}
