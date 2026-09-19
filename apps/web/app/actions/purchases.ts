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
  dueDate?: Date;
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

  const supplier = await db.supplier.findUnique({
    where: { id: data.supplierId },
    select: { name: true },
  });

  const createdPurchase = await db.$transaction(async tx => {
    const purchase = await tx.purchase.create({
      data: {
        organizationId: auth.organizationId,
        memberId: auth.memberId,
        supplierId: data.supplierId,
        purchaseNumber,
        totalAmount: totalAmount,
        dueDate: data.dueDate,
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

  // Dispatch ScrymeChat alert if Scryme is configured
  try {
    const org = await db.organization.findUnique({
      where: { id: auth.organizationId },
      select: { slug: true, scrymeConfiguration: true },
    });

    if (org?.scrymeConfiguration && org.slug) {
      const { ScrymeChatApiClient } = await import("@repo/chat");
      const scrymeClient = new ScrymeChatApiClient();

      const dueDateStr = data.dueDate
        ? new Date(data.dueDate).toLocaleDateString()
        : "N/A";

      await scrymeClient.sendMessage(org.slug, "general", {
        content: `📦 **New Purchase Order Created**\n- **Order #**: ${purchaseNumber}\n- **Supplier**: ${supplier?.name || "Supplier"}\n- **Total Amount**: KES ${totalAmount.toLocaleString()}\n- **Repayment Due Date**: ${dueDateStr}`,
      });
    }
  } catch (err: any) {
    console.error("Failed to send ScrymeChat notification for purchase order:", err?.message || err);
  }

  revalidatePath(`/inventory/supplier/${data.supplierId}`);
  return createdPurchase;
}

export async function receivePurchaseItems(
  purchaseId: string,
  items: { itemId: string; quantity: number }[],
) {
  return receivePurchaseStockWithBatches({
    purchaseId,
    items: items.map(item => ({
      purchaseItemId: item.itemId,
      quantity: item.quantity,
    })),
  });
}

export async function receivePurchaseStockWithBatches(data: {
  purchaseId: string;
  locationId?: string;
  notes?: string;
  documentRef?: string;
  items: {
    purchaseItemId: string;
    quantity: number;
    batchNumber?: string;
    supplierBatchNumber?: string;
    expiryDate?: Date | string;
    receivedDate?: Date | string;
    unitCost?: number;
    notes?: string;
  }[];
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const purchase = await db.purchase.findUnique({
    where: { id: data.purchaseId, organizationId: auth.organizationId },
    include: { items: true, supplier: true },
  });

  if (!purchase) {
    throw new Error("Purchase Order not found");
  }

  // Resolve location (use provided or default/first location for organization)
  let targetLocationId = data.locationId;
  if (!targetLocationId) {
    const defaultLoc = await db.inventoryLocation.findFirst({
      where: { organizationId: auth.organizationId, isDefault: true },
    }) || await db.inventoryLocation.findFirst({
      where: { organizationId: auth.organizationId },
    });

    if (!defaultLoc) {
      throw new Error("No inventory location found for organization");
    }
    targetLocationId = defaultLoc.id;
  }

  await db.$transaction(async tx => {
    for (const itemInput of data.items) {
      const pItem = purchase.items.find(i => i.id === itemInput.purchaseItemId);
      if (!pItem) continue;

      const receivedQty = Number(itemInput.quantity);
      if (receivedQty <= 0) continue;

      // 1. Update purchase item received quantity
      await tx.purchaseItem.update({
        where: { id: pItem.id },
        data: {
          receivedQuantity: { increment: receivedQty },
        },
      });

      // 2. Generate stock batch for tracking, expiry, and supplier genealogy
      const batchNo = itemInput.batchNumber || `BATCH-${Date.now()}-${pItem.id.slice(-4)}`;
      const expDate = itemInput.expiryDate ? new Date(itemInput.expiryDate) : null;
      const recDate = itemInput.receivedDate ? new Date(itemInput.receivedDate) : new Date();
      const pPrice = itemInput.unitCost ?? Number(pItem.unitCost || 0);

      const batch = await tx.stockBatch.create({
        data: {
          organizationId: auth.organizationId,
          variantId: pItem.variantId,
          locationId: targetLocationId,
          purchaseItemId: pItem.id,
          supplierId: purchase.supplierId,
          batchNumber: batchNo,
          supplierBatchNumber: itemInput.supplierBatchNumber || null,
          initialQuantity: receivedQty,
          currentQuantity: receivedQty,
          purchasePrice: pPrice,
          expiryDate: expDate,
          receivedDate: recDate,
        },
      });

      // 3. Increment or upsert product variant stock
      const existingStock = await tx.productVariantStock.findUnique({
        where: {
          variantId_locationId: {
            variantId: pItem.variantId,
            locationId: targetLocationId,
          },
        },
      });

      if (existingStock) {
        await tx.productVariantStock.update({
          where: { id: existingStock.id },
          data: {
            currentStock: { increment: receivedQty },
            availableStock: { increment: receivedQty },
          },
        });
      } else {
        const variant = await tx.productVariant.findUnique({
          where: { id: pItem.variantId },
          select: { productId: true },
        });

        if (variant) {
          await tx.productVariantStock.create({
            data: {
              organizationId: auth.organizationId,
              productId: variant.productId,
              variantId: pItem.variantId,
              locationId: targetLocationId,
              currentStock: receivedQty,
              availableStock: receivedQty,
            },
          });
        }
      }

      // 4. Log Stock Movement
      await tx.stockMovement.create({
        data: {
          organizationId: auth.organizationId,
          variantId: pItem.variantId,
          toLocationId: targetLocationId,
          stockBatchId: batch.id,
          quantity: receivedQty,
          movementType: "PURCHASE_RECEIPT",
          referenceType: "Purchase",
          referenceId: purchase.id,
          memberId: auth.memberId,
          notes: data.notes || itemInput.notes || `Received PO ${purchase.purchaseNumber}`,
        },
      });

      // 5. Log Stock Audit Log
      await tx.stockAuditLog.create({
        data: {
          organizationId: auth.organizationId,
          entityType: "Purchase",
          entityId: purchase.id,
          action: "STOCK_RECEIVED",
          fieldName: "receivedQuantity",
          newValue: `${receivedQty} received into batch ${batchNo}`,
          performedBy: auth.memberId,
          metadata: {
            batchId: batch.id,
            batchNumber: batchNo,
            supplierBatchNumber: itemInput.supplierBatchNumber,
            expiryDate: expDate,
            documentRef: data.documentRef,
          },
        },
      });
    }

    // Check overall purchase status
    const updatedPurchase = await tx.purchase.findUnique({
      where: { id: data.purchaseId },
      include: { items: true },
    });

    if (updatedPurchase) {
      const allReceived = updatedPurchase.items.every(
        i => Number(i.receivedQuantity) >= Number(i.orderedQuantity),
      );
      const anyReceived = updatedPurchase.items.some(
        i => Number(i.receivedQuantity) > 0,
      );

      await tx.purchase.update({
        where: { id: data.purchaseId },
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

  revalidatePath("/stocking/reception");
  revalidatePath("/finance/purchases");
  revalidatePath(`/finance/purchases/${data.purchaseId}`);
}

export async function getPendingPurchasesForReception() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  const purchases = await db.purchase.findMany({
    where: {
      organizationId: auth.organizationId,
      status: { in: ["ORDERED", "PARTIALLY_RECEIVED", "APPROVED"] },
    },
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
    orderBy: { createdAt: "desc" },
  });

  // Batch fetch stock batches for purchase items
  const purchaseItemIds = purchases.flatMap(p => p.items.map(i => i.id));
  const batches = await db.stockBatch.findMany({
    where: {
      purchaseItemId: { in: purchaseItemIds },
    },
  });

  const batchesByPurchaseItem = new Map<string, typeof batches>();
  for (const b of batches) {
    if (!b.purchaseItemId) continue;
    const list = batchesByPurchaseItem.get(b.purchaseItemId) || [];
    list.push(b);
    batchesByPurchaseItem.set(b.purchaseItemId, list);
  }

  return purchases.map(p => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierName: p.supplier?.name || "N/A",
    supplierId: p.supplierId,
    orderDate: p.orderDate,
    dueDate: p.dueDate,
    status: p.status,
    totalAmount: Number(p.totalAmount?.toString() || 0),
    items: p.items.map(item => {
      const itemBatches = batchesByPurchaseItem.get(item.id) || [];
      return {
        id: item.id,
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        sku: item.variant.sku,
        orderedQuantity: Number(item.orderedQuantity.toString()),
        receivedQuantity: Number(item.receivedQuantity.toString()),
        pendingQuantity: Math.max(
          0,
          Number(item.orderedQuantity.toString()) - Number(item.receivedQuantity.toString()),
        ),
        unitCost: Number(item.unitCost.toString()),
        existingBatches: itemBatches.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          supplierBatchNumber: b.supplierBatchNumber,
          currentQuantity: Number(b.currentQuantity.toString()),
          expiryDate: b.expiryDate,
        })),
      };
    }),
  }));
}

export async function getBatchTraceabilityList(search?: string) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  const where: any = {
    organizationId: auth.organizationId,
  };

  if (search) {
    where.OR = [
      { batchNumber: { contains: search, mode: "insensitive" } },
      { supplierBatchNumber: { contains: search, mode: "insensitive" } },
      { variant: { name: { contains: search, mode: "insensitive" } } },
      { variant: { product: { name: { contains: search, mode: "insensitive" } } } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const batches = await db.stockBatch.findMany({
    where,
    include: {
      variant: { include: { product: true } },
      supplier: true,
      location: true,
      purchaseItem: { include: { purchase: true } },
      movements: true,
    },
    orderBy: { receivedDate: "desc" },
    take: 100,
  });

  return batches.map(b => ({
    id: b.id,
    batchNumber: b.batchNumber,
    supplierBatchNumber: b.supplierBatchNumber,
    productName: b.variant.product.name,
    variantName: b.variant.name,
    sku: b.variant.sku,
    supplierName: b.supplier?.name || "N/A",
    locationName: b.location?.name || "N/A",
    initialQuantity: Number(b.initialQuantity.toString()),
    currentQuantity: Number(b.currentQuantity.toString()),
    purchasePrice: Number(b.purchasePrice.toString()),
    expiryDate: b.expiryDate,
    receivedDate: b.receivedDate,
    purchaseNumber: b.purchaseItem?.purchase.purchaseNumber || "N/A",
  }));
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
