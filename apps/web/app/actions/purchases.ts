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
    "EMPLOYEE",
    "CASHIER",
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
  const { auth, member } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "CASHIER",
  ]);

  const totalAmount = data.items.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0,
  );

  // ⚡ Bolt Optimization: Parallelize independent read queries outside active transaction.
  // Executing purchase count, supplier name lookup, and organization approval threshold concurrently
  // via Promise.all collapses 3 sequential database roundtrips down to 1 flat concurrent roundtrip,
  // while also reducing transaction duration and database row locking time.
  const [count, supplier, org] = await Promise.all([
    data.purchaseNumber
      ? null
      : db.purchase.count({
          where: { organizationId: auth.organizationId },
        }),
    db.supplier.findUnique({
      where: { id: data.supplierId },
      select: { name: true },
    }),
    db.organization.findUnique({
      where: { id: auth.organizationId },
      select: { expenseApprovalThreshold: true, slug: true, scrymeConfiguration: true },
    }),
  ]);

  const purchaseNumber =
    data.purchaseNumber ||
    `PO-${new Date().getFullYear()}-${((count || 0) + 1).toString().padStart(4, "0")}`;

  const threshold = org?.expenseApprovalThreshold
    ? Number(org.expenseApprovalThreshold)
    : 0;

  const createdPurchase = await db.$transaction(async tx => {
    const purchase = await tx.purchase.create({
      data: {
        organizationId: auth.organizationId,
        memberId: auth.memberId,
        supplierId: data.supplierId,
        purchaseNumber,
        totalAmount: totalAmount,
        dueDate: data.dueDate ? (isNaN(new Date(data.dueDate).getTime()) ? undefined : new Date(data.dueDate)) : undefined,
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

    const requiresApproval =
      !["OWNER", "ADMIN"].includes(member.role) || (threshold > 0 && totalAmount > threshold);

    if (requiresApproval) {
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

  // Dispatch ScrymeChat alert if Scryme is configured (using pre-fetched org configuration)
  try {
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
  const { auth, member } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "CASHIER",
  ]);

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
    // Filter and collect valid received purchase items
    const validItems = data.items
      .map(itemInput => {
        const pItem = purchase.items.find(i => i.id === itemInput.purchaseItemId);
        if (!pItem) return null;
        const receivedQty = Number(itemInput.quantity);
        if (receivedQty <= 0) return null;
        return { itemInput, pItem, receivedQty };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (validItems.length > 0) {
      const variantIds = Array.from(new Set(validItems.map(v => v.pItem.variantId)));

      // ⚡ Bolt Optimization: Batch fetch existing stock records and missing product variants up-front,
      // converting up to 5N sequential database queries per item into batched read queries,
      // consolidated per-variant stock upserts, and concurrent write operations via Promise.all.
      const existingStocks = await tx.productVariantStock.findMany({
        where: {
          locationId: targetLocationId,
          variantId: { in: variantIds },
        },
      });
      const stockMap = new Map(existingStocks.map(s => [s.variantId, s]));

      const missingVariantIds = variantIds.filter(vId => !stockMap.has(vId));
      let variantMap = new Map<string, { productId: string }>();
      if (missingVariantIds.length > 0) {
        const variants = await tx.productVariant.findMany({
          where: { id: { in: missingVariantIds } },
          select: { id: true, productId: true },
        });
        variantMap = new Map(variants.map(v => [v.id, v]));
      }

      // Consolidate total received stock quantity per variantId to eliminate lock contention
      // and duplicate row insertion collisions when multiple items share the same variant.
      const variantTotals = new Map<string, { totalQty: number; productId: string }>();
      for (const { pItem, receivedQty } of validItems) {
        const current = variantTotals.get(pItem.variantId);
        const productId = stockMap.get(pItem.variantId)?.productId || variantMap.get(pItem.variantId)?.productId || "";
        if (current) {
          current.totalQty += receivedQty;
        } else {
          variantTotals.set(pItem.variantId, { totalQty: receivedQty, productId });
        }
      }

      // Execute consolidated stock updates (1 query per unique variant)
      const stockOps = Array.from(variantTotals.entries()).map(([variantId, { totalQty, productId }]) => {
        const existingStock = stockMap.get(variantId);
        if (existingStock) {
          return tx.productVariantStock.update({
            where: { id: existingStock.id },
            data: {
              currentStock: { increment: totalQty },
              availableStock: { increment: totalQty },
            },
          });
        } else if (productId) {
          return tx.productVariantStock.create({
            data: {
              organizationId: auth.organizationId,
              productId,
              variantId,
              locationId: targetLocationId,
              currentStock: totalQty,
              availableStock: totalQty,
            },
          });
        }
        return Promise.resolve();
      });

      // Process item-level receipts, batches, movements, and audit logs concurrently
      const itemOps = validItems.map(async ({ itemInput, pItem, receivedQty }) => {
        const batchNo = itemInput.batchNumber || `BATCH-${Date.now()}-${pItem.id.slice(-4)}`;
        const expDate = itemInput.expiryDate ? new Date(itemInput.expiryDate) : null;
        const recDate = itemInput.receivedDate ? new Date(itemInput.receivedDate) : new Date();
        const pPrice = itemInput.unitCost ?? Number(pItem.unitCost || 0);

        // 1. Update purchase item received quantity
        const updateItemOp = tx.purchaseItem.update({
          where: { id: pItem.id },
          data: {
            receivedQuantity: { increment: receivedQty },
          },
        });

        // 2. Generate stock batch for tracking, expiry, and supplier genealogy
        const createBatchOp = tx.stockBatch.create({
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

        const [, batch] = await Promise.all([updateItemOp, createBatchOp]);

        // 3. Log Stock Movement
        const movementOp = tx.stockMovement.create({
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

        // 4. Log Stock Audit Log
        const auditOp = tx.stockAuditLog.create({
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

        await Promise.all([movementOp, auditOp]);
      });

      await Promise.all([...stockOps, ...itemOps]);
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
    "EMPLOYEE",
    "CASHIER",
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
    "EMPLOYEE",
    "CASHIER",
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
  const { auth, member } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "CASHIER",
  ]);

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
  const { auth, member } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "CASHIER",
  ]);

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
  const { auth, member } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "CASHIER",
  ]);

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
