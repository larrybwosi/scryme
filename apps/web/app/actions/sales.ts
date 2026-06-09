"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentStatus,
  PaymentMethod,
  FulfillmentStatus,
  MemberRole,
  Prisma,
} from "@repo/db/client";
import { Decimal } from "decimal.js";

async function getMember(organizationId: string, userId: string) {
  console.log(organizationId, userId);
  return await db.member.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
}

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const member = await getMember(auth.organizationId, auth.user.id);
  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function getTransactions(params: {
  search?: string;
  type?: TransactionType | "all";
  status?: TransactionStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  locationId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);

  const where: Prisma.TransactionWhereInput = {
    organizationId: auth.organizationId,
  };

  if (params.search) {
    where.OR = [
      { number: { contains: params.search, mode: "insensitive" } },
      { customer: { name: { contains: params.search, mode: "insensitive" } } },
      { notes: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.type && params.type !== "all") {
    where.type = params.type;
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.paymentStatus && params.paymentStatus !== "all") {
    where.paymentStatus = params.paymentStatus;
  }

  if (params.locationId && params.locationId !== "all") {
    where.locationId = params.locationId;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  return await db.transaction.findMany({
    where,
    include: {
      customer: true,
      location: true,
      member: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getTransactionById(id: string) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);

  return await db.transaction.findUnique({
    where: {
      id,
      organizationId: auth.organizationId,
    },
    include: {
      customer: true,
      location: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      payments: true,
      fulfillments: {
        include: {
          items: true,
          driver: true,
        },
      },
      member: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function createTransaction(data: {
  type: TransactionType;
  customerId?: string;
  locationId: string;
  items: {
    variantId: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    taxAmount?: number;
    discountAmount?: number;
    notes?: string;
  }[];
  notes?: string;
  expectedDeliveryDate?: Date;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const count = await db.transaction.count({
    where: { organizationId: auth.organizationId },
  });
  const number = `TRX-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;

  const subtotal = data.items.reduce(
    (acc, item) => acc.plus(new Decimal(item.unitPrice).mul(item.quantity)),
    new Decimal(0),
  );
  const taxTotal = data.items.reduce(
    (acc, item) => acc.plus(new Decimal(item.taxAmount || 0)),
    new Decimal(0),
  );
  const discountTotal = data.items.reduce(
    (acc, item) => acc.plus(new Decimal(item.discountAmount || 0)),
    new Decimal(0),
  );
  const finalTotal = subtotal.plus(taxTotal).minus(discountTotal);

  const transaction = await db.transaction.create({
    data: {
      organizationId: auth.organizationId,
      memberId: auth.user.id,
      number,
      type: data.type,
      customerId: data.customerId,
      locationId: data.locationId,
      subtotal,
      taxTotal,
      discountTotal,
      finalTotal,
      baseCurrencyTotal: finalTotal,
      status: data.type === "QUOTE" ? "DRAFT" : "PENDING_CONFIRMATION",
      paymentStatus: "UNPAID",
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          listPrice: item.unitPrice,
          unitCost: item.unitCost,
          taxAmount: item.taxAmount || 0,
          discountAmount: item.discountAmount || 0,
          subtotal: new Decimal(item.unitPrice).mul(item.quantity),
          lineTotal: new Decimal(item.unitPrice)
            .mul(item.quantity)
            .plus(item.taxAmount || 0)
            .minus(item.discountAmount || 0),
          productName: "", // These should be fetched or snapshotted properly
          variantName: "",
          sku: "",
          notes: item.notes,
        })),
      },
    },
  });

  // Snapshot item details (simplified for now, ideally done in the create or a service)
  for (const item of data.items) {
    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: true },
    });
    if (variant) {
      await db.transactionItem.updateMany({
        where: { transactionId: transaction.id, variantId: item.variantId },
        data: {
          productName: variant.product.name,
          variantName: variant.name || "Default",
          sku: variant.sku,
        },
      });
    }
  }

  revalidatePath("/sales/transactions");
  return transaction;
}

export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus,
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const transaction = await db.transaction.update({
    where: { id, organizationId: auth.organizationId },
    data: { status },
  });

  revalidatePath("/sales/transactions");
  revalidatePath(`/sales/transactions/${id}`);
  return transaction;
}

export async function addPayment(
  transactionId: string,
  data: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  },
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId, organizationId: auth.organizationId },
    include: { payments: true },
  });

  if (!transaction) throw new Error("Transaction not found");

  const payment = await db.payment.create({
    data: {
      transactionId,
      organizationId: auth.organizationId,
      amount: data.amount,
      method: data.method,
      referenceNumber: data.reference,
      notes: data.notes,
      status: "COMPLETED",
    },
  });

  const totalPaid = new Decimal(transaction.totalPaid).plus(data.amount);
  let paymentStatus: PaymentStatus = "PARTIALLY_PAID";

  if (totalPaid.gte(transaction.finalTotal)) {
    paymentStatus = "PAID";
  }

  await db.transaction.update({
    where: { id: transactionId },
    data: {
      totalPaid,
      paymentStatus,
    },
  });

  revalidatePath("/sales/transactions");
  revalidatePath(`/sales/transactions/${transactionId}`);
  return payment;
}

export async function getFulfillments(params: {
  status?: FulfillmentStatus | "all";
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);

  const where: Prisma.FulfillmentWhereInput = {
    transaction: {
      organizationId: auth.organizationId,
    },
  };

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.driverId && params.driverId !== "all") {
    where.driverId = params.driverId;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  return await db.fulfillment.findMany({
    where,
    include: {
      transaction: {
        include: {
          customer: true,
        },
      },
      driver: true,
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateFulfillmentStatus(
  id: string,
  status: FulfillmentStatus,
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.update({
    where: { id },
    data: { status },
    include: { transaction: true },
  });

  revalidatePath("/sales/deliveries");
  return fulfillment;
}

export async function createOrderAction(data: any) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  if (data.type === "POS_SALE") {
    const { processSale } = await import("@repo/shared/actions/transaction/process.sale");

    // Transform OrderForm data to ProcessSaleInput
    const saleData = {
      cartItems: data.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      locationId: data.locationId,
      customerId: data.customerId,
      discountAmount: data.discountAmount,
      notes: data.notes,
      payments: [
        {
          method: "CASH", // Default for now
          amount: data.items.reduce((acc: number, item: any) =>
            acc + (item.unitPrice * item.quantity) + (item.taxAmount || 0) - (item.discountAmount || 0), 0) - (data.discountAmount || 0)
        }
      ],
      enableStockTracking: true
    };

    const result = await processSale(
      auth.organizationId,
      auth.user.id,
      saleData
    );

    if (result.success) {
      revalidatePath("/sales/transactions");
    }

    return result;
  }

  // Import shared logic for QUOTE and SALES_ORDER
  const { createOrder } = await import("@repo/shared/actions/transaction/create.order");

  const result = await createOrder(
    auth.organizationId,
    auth.user.id,
    {
      ...data,
      type: data.type === "QUOTE" ? "QUOTE" : "SALES_ORDER",
      status: data.type === "QUOTE" ? "DRAFT" : "PENDING_CONFIRMATION",
      fulfillment: {
        type: "DELIVERY", // Default
        pickupLocationId: data.locationId,
      }
    }
  );

  if (result.success) {
    revalidatePath("/sales/transactions");
  }

  return result;
}

export async function bulkUpdateTransactionStatus(
  ids: string[],
  status: TransactionStatus,
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const result = await db.transaction.updateMany({
    where: {
      id: { in: ids },
      organizationId: auth.organizationId,
    },
    data: { status },
  });

  revalidatePath("/sales/transactions");
  return result;
}

export async function bulkUpdateFulfillmentStatus(
  ids: string[],
  status: FulfillmentStatus,
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const result = await db.fulfillment.updateMany({
    where: {
      id: { in: ids },
      transaction: {
        organizationId: auth.organizationId,
      },
    },
    data: { status },
  });

  revalidatePath("/sales/deliveries");
  return result;
}

export async function reconcileFulfillment(
  id: string,
  data: {
    notes?: string;
    receivedBy?: string;
  },
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.update({
    where: { id },
    data: {
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy: auth.user.id,
      receivedBy: data.receivedBy,
      deliveryNotes: data.notes,
      status: "COMPLETED",
    },
  });

  revalidatePath("/sales/deliveries");
  return fulfillment;
}
