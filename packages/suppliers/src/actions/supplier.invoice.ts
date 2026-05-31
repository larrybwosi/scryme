import { db as prisma } from '@repo/db';
import { SupplierInvoice, PaymentStatus, PurchaseStatus, Prisma } from '@repo/db';
import { z } from 'zod';

// --- No change to create schema ---
export const createInvoiceSchema = z.object({
  purchaseId: z.string().cuid(),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  supplierId: z.string().cuid().optional().nullable(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  totalAmount: z.number().min(0, 'Total amount must be positive.'),
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

  if (!purchase) throw new Error('Purchase not found');

  const invoice = await prisma.supplierInvoice.create({
    data: {
      purchaseId: data.purchaseId,
      invoiceNumber: data.invoiceNumber,
      supplierId: data.supplierId || purchase.supplierId,
      organizationId: purchase.organizationId,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      totalAmount: new Prisma.Decimal(data.totalAmount),
      amountPaid: 0,
      status: 'UNPAID',
      notes: data.notes,
      invoiceUrl: data.invoiceUrl,
    },
  });

  await prisma.purchase.update({
    where: { id: data.purchaseId },
    data: { status: 'BILLED' },
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
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Updates an existing invoice (e.g., partial payment, status change).
 */
export async function updateSupplierInvoice(invoiceId: string, data: UpdateInvoiceDto) {
  const currentInvoice = await prisma.supplierInvoice.findUnique({
    where: { id: invoiceId },
  });

  if (!currentInvoice) throw new Error('Invoice not found');

  const updatedInvoice = await prisma.supplierInvoice.update({
    where: { id: invoiceId },
    data: {
      ...data,
      notes: data.notes ?? undefined,
      invoiceUrl: data.invoiceUrl ?? undefined,
      amountPaid: data.amountPaid !== undefined ? new Prisma.Decimal(data.amountPaid) : undefined,
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
