'use server';

import { db } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateDocumentToken } from '@repo/shared/api/v2';

const invoiceSchema = z.object({
  customerId: z.string(),
  organizationId: z.string(),
  postingDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  items: z.array(z.object({
    itemCode: z.string(),
    itemName: z.string(),
    quantity: z.number(),
    rate: z.number(),
    amount: z.number(),
  })),
  status: z.string().default('DRAFT'),
});

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>;

export async function createInvoiceAction(data: CreateInvoiceInput): Promise<any> {
  try {
    const validatedData = invoiceSchema.parse(data);

    const netTotal = validatedData.items.reduce((sum, item) => sum + item.amount, 0);

    const invoice = await db.invoice.create({
      data: {
        customerId: validatedData.customerId,
        organizationId: validatedData.organizationId,
        postingDate: validatedData.postingDate,
        dueDate: validatedData.dueDate,
        status: validatedData.status,
        netTotal: netTotal,
        grandTotal: netTotal,
        balanceDue: netTotal,
        items: {
          create: validatedData.items,
        },
      },
    });

    revalidatePath(`/customers/${validatedData.customerId}`);
    return { success: true, data: invoice };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error.message || 'Failed to create invoice' };
  }
}

export async function getInvoiceDownloadUrl(invoiceId: string, organizationId: string): Promise<string> {
  try {
    const token = generateDocumentToken('invoice', invoiceId, organizationId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.scryme.tech';
    return `${apiUrl}/public-invoices/${invoiceId}/download?token=${token}`;
  } catch (error) {
    console.error('Error generating invoice download token:', error);
    throw new Error('Failed to generate secure download link');
  }
}
