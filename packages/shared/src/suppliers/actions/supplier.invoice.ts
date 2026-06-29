import { db as prisma } from "@repo/db";
import {
  PaymentStatus,
  Prisma,
} from "@repo/db";
import { z } from "zod";

// --- No change to create schema ---
export const createInvoiceSchema = z.object({
  purchaseId: z.string().cuid(),
  organizationId: z.string().cuid(),
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  supplierId: z.string().cuid(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  subTotal: z.number().min(0, "Subtotal must be positive."),
  taxAmount: z.number().min(0, "Tax amount must be positive."),
  totalAmount: z.number().min(0, "Total amount must be positive."),
  invoiceUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;

// --- NEW: Zod schema for validating updates ---
export const updateInvoiceSchema = z.object({
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  amountPaid: z.number().min(0).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  notes: z.string().nullable().optional(),
  invoiceUrl: z.string().url().nullable().optional(),
});

export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;

/**
 * Creates a new invoice for a given purchase order.
 */
export async function createSupplierInvoice(data: CreateInvoiceDto) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: data.purchaseId },
  });

  if (!purchase) throw new Error("Purchase not found");

  const invoice = await prisma.supplierInvoice.create({
    data: {
      purchaseId: data.purchaseId,
      organizationId: data.organizationId || purchase.organizationId,
      invoiceNumber: data.invoiceNumber,
      supplierId: data.supplierId || purchase.supplierId,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      subTotal: new Prisma.Decimal(data.subTotal),
      taxAmount: new Prisma.Decimal(data.taxAmount),
      totalAmount: new Prisma.Decimal(data.totalAmount),
      amountPaid: new Prisma.Decimal(0),
      status: "UNPAID",
      notes: data.notes ?? undefined,
      invoiceUrl: data.invoiceUrl ?? undefined,
    },
  });

  await prisma.purchase.update({
    where: { id: data.purchaseId },
    data: { status: "BILLED" },
  });

  return invoice;
}

/**
 * Lists all invoices for an organization.
 */
export async function getSupplierInvoices(organizationId: string) {
  return prisma.supplierInvoice.findMany({
    where: {
      purchase: { organizationId },
    },
    include: {
      purchase: true,
      supplier: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Updates an existing invoice (e.g., partial payment, status change).
 */
export async function updateSupplierInvoice(
  invoiceId: string,
  data: UpdateInvoiceDto,
) {
  const currentInvoice = await prisma.supplierInvoice.findUnique({
    where: { id: invoiceId },
  });

  if (!currentInvoice) throw new Error("Invoice not found");

  const updatedInvoice = await prisma.supplierInvoice.update({
    where: { id: invoiceId },
    data: {
      ...data,
      notes: data.notes ?? undefined,
      invoiceUrl: data.invoiceUrl ?? undefined,
      amountPaid:
        data.amountPaid !== undefined
          ? new Prisma.Decimal(data.amountPaid)
          : undefined,
      totalAmount: undefined, // ensure it is not overwritten if not in data
    },
  });

  return updatedInvoice;
}

/**
 * Deletes an invoice.
 */
export async function deleteSupplierInvoice(invoiceId: string) {
  return prisma.supplierInvoice.delete({
    where: { id: invoiceId },
  });
}
