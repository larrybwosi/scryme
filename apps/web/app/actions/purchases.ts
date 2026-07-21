"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Purchase,
  Supplier,
  MemberRole,
  PurchaseStatus,
  PaymentStatus,
  ThreeWayMatchStatus,
} from "@repo/db/client";
import { submitForApproval } from "./approvals";

async function checkPermission(allowedRoles: MemberRole[], isPageLoad = false) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=unauthenticated");
    }
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=insufficient_permissions");
    }
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function getPurchases(params: {
  search?: string;
  status?: string;
}): Promise<any[]> {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

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

  return purchases.map(p => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierName: p.supplier.name,
    amount: Number(p.totalAmount?.toString() || 0),
    status: p.status,
    date: p.orderDate,
    itemCount: p.items.length,
    product: p.items[0]?.variant.product.name || "N/A",
    category: p.items[0]?.variant.product.categoryId || "N/A",
    image:
      p.items[0]?.variant.product.imageUrls[0] ||
      "https://api.dicebear.com/7.x/shapes/svg?seed=" + p.id,
  }));
}

export async function createPurchase(data: {
  supplierId: string;
  items: { variantId: string; quantity: number; unitCost: number }[];
  purchaseNumber?: string;
}): Promise<any> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const totalAmount = data.items.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0,
  );

  // Generate purchase number if not provided
  let purchaseNumber = data.purchaseNumber;
  if (!purchaseNumber) {
    const count = await db.purchase.count({
      where: { organizationId: auth.organizationId },
    });
    purchaseNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
  }

  return await db.$transaction(async tx => {
    const purchase = await tx.purchase.create({
      data: {
        organizationId: auth.organizationId,
        memberId: auth.memberId,
        supplierId: data.supplierId,
        purchaseNumber,
        totalAmount: totalAmount,
        status: "DRAFT",
        items: {
          create: data.items.map(item => ({
            variantId: item.variantId,
            orderedQuantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
          })),
        },
      },
    });

    // Check for approval threshold
    const org = await tx.organization.findUnique({
      where: { id: auth.organizationId },
      select: { expenseApprovalThreshold: true },
    });

    const threshold = org?.expenseApprovalThreshold
      ? Number(org.expenseApprovalThreshold)
      : 0;

    if (totalAmount > threshold) {
      await submitForApproval(
        {
          relatedId: purchase.id,
          type: "PURCHASE_ORDER",
          amount: totalAmount,
          relatedRecordNumber: purchaseNumber!,
        },
        tx,
      );
    } else {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: "ORDERED" },
      });
    }

    revalidatePath("/finance/purchases");
    return purchase;
  });
}

export async function receivePurchaseItems(
  purchaseId: string,
  items: { itemId: string; quantity: number }[],
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  await db.$transaction(async tx => {
    for (const item of items) {
      await tx.purchaseItem.update({
        where: { id: item.itemId },
        data: {
          receivedQuantity: { increment: item.quantity },
        },
      });
    }

    // Check if all items received
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (purchase) {
      const allReceived = purchase.items.every(
        i => i.receivedQuantity >= i.orderedQuantity,
      );
      const anyReceived = purchase.items.some(i => i.receivedQuantity > 0);

      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: allReceived
            ? "RECEIVED"
            : anyReceived
              ? "PARTIALLY_RECEIVED"
              : "ORDERED",
        },
      });
    }
  });

  revalidatePath("/finance/purchases");
}

export async function recordSupplierInvoice(data: {
  purchaseId: string;
  invoiceNumber: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const purchase = await db.purchase.findUnique({
    where: { id: data.purchaseId },
  });

  if (!purchase) throw new Error("Purchase order not found");

  const invoice = await db.supplierInvoice.create({
    data: {
      organizationId: auth.organizationId,
      purchaseId: data.purchaseId,
      supplierId: purchase.supplierId,
      invoiceNumber: data.invoiceNumber,
      totalAmount: data.amount,
      subTotal: data.amount, // Simplified
      taxAmount: 0,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: "UNPAID",
    },
  });

  await db.purchase.update({
    where: { id: data.purchaseId },
    data: { status: "BILLED" },
  });

  revalidatePath("/finance/purchases");
  return invoice;
}

export async function updatePurchaseStatus(
  id: string,
  status: any,
): Promise<any> {
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
      memberId: auth.memberId,
    },
  });

  const purchase = await db.purchase.findUnique({
    where: { id: data.purchaseId },
    include: { payments: true },
  });

  if (purchase) {
    const totalPaid = purchase.payments.reduce(
      (acc, p) => acc + Number(p.amount?.toString() || 0),
      0,
    );
    let paymentStatus: any = "PARTIALLY_PAID";
    if (totalPaid >= Number(purchase.totalAmount?.toString() || 0)) {
      paymentStatus = "PAID";
    }

    await db.purchase.update({
      where: { id: data.purchaseId },
      data: {
        paidAmount: totalPaid,
        paymentStatus: paymentStatus,
      },
    });
  }

  revalidatePath("/finance/purchases");
  return payment;
}
