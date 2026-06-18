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
  FulfillmentType,
  MemberRole,
  Prisma,
} from "@repo/db/client";
import { Decimal } from "decimal.js";

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

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
      payments: {
        include: {
          attachments: true,
        },
      },
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
  const orgSettings = await db.organizationSettings.findUnique({
    where: { organizationId: auth.organizationId },
  });

  const transaction = await db.transaction.create({
    data: {
      organizationId: auth.organizationId,
      memberId: auth.memberId,
      currencyCode: orgSettings?.defaultCurrency || "USD",
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
        create: data.items.map(item => ({
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
    chequeDate?: Date;
    bankName?: string;
    attachments?: {
      fileName: string;
      fileUrl: string;
      mimeType: string;
      sizeBytes?: number;
    }[];
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
      chequeDate: data.chequeDate,
      bankName: data.bankName,
      status: "COMPLETED",
      attachments: data.attachments
        ? {
            create: data.attachments.map(att => ({
              ...att,
              organizationId: auth.organizationId!,
              memberId: auth.memberId!,
            })),
          }
        : undefined,
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

export async function addAttachmentToPayment(
  paymentId: string,
  data: {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes?: number;
    description?: string;
    shortCode?: string;
    shortUrl?: string;
  },
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const attachment = await db.attachment.create({
    data: {
      ...data,
      paymentId,
      organizationId: auth.organizationId!,
      memberId: auth.memberId!,
    },
  });

  return attachment;
}

export async function createFulfillment(data: {
  transactionId: string;
  type: FulfillmentType;
  items: { transactionItemId: string; quantity: number }[];
  shippingAddressId?: string;
  pickupLocationId?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.create({
    data: {
      transactionId: data.transactionId,
      type: data.type,
      shippingAddressId: data.shippingAddressId,
      pickupLocationId: data.pickupLocationId,
      status: "PENDING",
      items: {
        create: data.items.map(item => ({
          transactionItemId: item.transactionItemId,
          quantity: item.quantity,
        })),
      },
    },
  });

  revalidatePath("/sales/transactions");
  revalidatePath("/sales/deliveries");

  // Background generation of proof documents
   const { documentService } = await import('@repo/shared/lib/services/document');
  documentService.generateAndAttachProofDocuments({
      transactionId: fulfillment.transactionId,
      fulfillmentId: fulfillment.id,
      organizationId: auth.organizationId!,
      memberId: auth.memberId!,
  }).catch(err => console.error('Failed to generate proof documents:', err));

  return fulfillment;
}

export async function createOrderAction(data: {
  type: TransactionType;
  customerId: string;
  businessAccountId?: string;
  locationId: string;
  items: any[];
  notes?: string;
  termsAndConditions?: string;
  discountAmount?: number;
  shippingFee?: number;
  deliveryPartnerId?: string;
  shippingAddressId?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  if (data.type === "POS_SALE") {
    const { processSale } = await import("@repo/shared/actions/transaction/process-sale");

    // Transform OrderForm data to ProcessSaleInput
    const saleData = {
      cartItems: data.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      locationId: data.locationId,
      customerId: data.customerId,
      businessAccountId: data.businessAccountId,
      discountAmount: data.discountAmount,
      notes: data.notes,
      payments: [
        {
          method: "CASH", // Default for now
          amount:
            data.items.reduce(
              (acc: number, item: any) =>
                acc +
                item.unitPrice * item.quantity +
                (item.taxAmount || 0) -
                (item.discountAmount || 0),
              0,
            ) -
            (data.discountAmount || 0) +
            (data.shippingFee || 0),
        },
      ],
      enableStockTracking: true,
    };

    const result = await processSale(
      auth.organizationId,
      auth.memberId,
      saleData,
    );

    if (result.success) {
      revalidatePath("/sales/transactions");
    }

    return result;
  }

  // Import shared logic for QUOTE and SALES_ORDER
  const { createOrder } = await import("@repo/shared/actions/transaction/orders");
  const { OrderTransactionStatus } = await import("@repo/shared/lib/validations/order");

  const result = await createOrder(auth.organizationId, auth.memberId, {
    ...data,
    businessAccountId: data.businessAccountId,
    type: data.type === "QUOTE" ? "QUOTE" : "SALES_ORDER",
    status:
      data.type === "QUOTE"
        ? OrderTransactionStatus.DRAFT
        : OrderTransactionStatus.PENDING_CONFIRMATION,
    payments: [],
    shippingFee: data.shippingFee || 0,
    discountAmount: data.discountAmount || 0,
    deliveryPartnerId: data.deliveryPartnerId,
    fulfillment: {
      type: "DELIVERY", // Default
      pickupLocationId: data.locationId,
      shippingAddressId: data.shippingAddressId,
    },
  });

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
    otp?: string;
    attachments?: { fileName: string; fileUrl: string; mimeType: string; sizeBytes?: number; description?: string }[];
  },
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.findUnique({
    where: { id },
    include: { attachments: true }
  });

  if (!fulfillment) throw new Error("Fulfillment not found");

  // If OTP is provided, verify it
  if (data.otp && fulfillment.confirmationToken && data.otp !== fulfillment.confirmationToken) {
    throw new Error("Invalid verification code");
  }

  const result = await db.$transaction(async (tx) => {
    const updatedFulfillment = await tx.fulfillment.update({
      where: { id },
      data: {
        // We don't mark as reconciled yet, staff will do that
        receivedBy: data.receivedBy,
        deliveryNotes: data.notes,
        status: "DELIVERED", // Mark as delivered once OTP is verified
        deliveredAt: new Date(),
        attachments: data.attachments ? {
          create: data.attachments.map(att => ({
            ...att,
            organizationId: auth.organizationId!,
            memberId: auth.memberId!,
            transactionId: fulfillment.transactionId,
          }))
        } : undefined,
      },
    });

    // Update Transaction status to DELIVERED as well
    await tx.transaction.update({
      where: { id: fulfillment.transactionId },
      data: { status: "DELIVERED" }
    });

    return updatedFulfillment;
  });

  revalidatePath("/sales/deliveries");
  revalidatePath("/sales/transactions");
  return result;
}

export async function approveFulfillment(id: string) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.findUnique({
    where: { id },
    include: { transaction: true }
  });

  if (!fulfillment) throw new Error("Fulfillment not found");

  const result = await db.$transaction(async (tx) => {
    const updatedFulfillment = await tx.fulfillment.update({
      where: { id },
      data: {
        isReconciled: true,
        reconciledAt: new Date(),
        reconciledBy: auth.memberId,
        status: "COMPLETED",
      },
    });

    // When staff approves, mark the transaction as completed
    await tx.transaction.update({
      where: { id: fulfillment.transactionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return updatedFulfillment;
  });

  revalidatePath("/sales/deliveries");
  revalidatePath("/sales/transactions");
  revalidatePath(`/sales/transactions/${fulfillment.transactionId}`);
  return result;
}

export async function uploadFileAction(formData: FormData) {
  const authResult = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);
  const { auth } = authResult;

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const { storageService, StorageCoreService } = await import(
    "@repo/shared/storage"
  );
  const { v7: uuidv7 } = await import("uuid");

  const fileName = StorageCoreService.generateStorageFileName(
    file.name,
    uuidv7(),
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await storageService.upload(buffer, fileName, file.type, {
    organizationId: auth.organizationId!,
  });

  const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

  const attachment = await db.attachment.create({
    data: {
      id: fileName,
      fileName: file.name,
      fileUrl: result.url,
      shortCode,
      shortUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      organizationId: auth.organizationId!,
      memberId: auth.memberId!,
    },
  });

  return {
    id: attachment.id,
    fileName: attachment.fileName || "file",
    fileUrl: attachment.fileUrl || "",
    shortUrl: attachment.shortUrl || "",
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes || 0,
  };
}

export async function uploadFulfillmentAttachment(
  fulfillmentId: string,
  data: {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes?: number;
    description?: string;
    shortCode?: string;
    shortUrl?: string;
  }
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.findUnique({
    where: { id: fulfillmentId }
  });

  if (!fulfillment) throw new Error("Fulfillment not found");

  const attachment = await db.attachment.create({
    data: {
      ...data,
      fulfillmentId,
      transactionId: fulfillment.transactionId,
      organizationId: auth.organizationId!,
      memberId: auth.memberId!,
    },
  });

  revalidatePath("/sales/deliveries");
  return attachment;
}
