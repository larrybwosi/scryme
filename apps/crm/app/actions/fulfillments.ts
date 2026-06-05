'use server';

import { db } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const fulfillmentSchema = z.object({
  transactionId: z.string(),
  type: z.enum(['IMMEDIATE', 'PICKUP', 'DELIVERY', 'SHIPPING', 'DIGITAL', 'DINE_IN', 'SERVICE']),
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
  deliveryNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export type CreateFulfillmentInput = z.infer<typeof fulfillmentSchema>;

export async function createFulfillmentAction(data: CreateFulfillmentInput): Promise<any> {
  try {
    const validatedData = fulfillmentSchema.parse(data);

    const fulfillment = await db.fulfillment.create({
      data: {
        transactionId: validatedData.transactionId,
        type: validatedData.type,
        status: validatedData.status,
        deliveryNotes: validatedData.deliveryNotes,
        trackingNumber: validatedData.trackingNumber,
        carrier: validatedData.carrier,
        scheduledAt: validatedData.scheduledAt,
      },
      include: {
        transaction: true,
      }
    });

    if (fulfillment.transaction?.customerId) {
      revalidatePath(`/customers/${fulfillment.transaction.customerId}`);
    }
    return { success: true, data: fulfillment };
  } catch (error: any) {
    console.error('Error creating fulfillment:', error);
    return { success: false, error: error.message || 'Failed to create fulfillment' };
  }
}
