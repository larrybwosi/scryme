'use server';

import { db, type CrmActivity } from '@repo/db';
import { crmActivitySchema, type CrmActivityFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createActivity(data: CrmActivityFormValues, organizationId: string, memberId?: string | null): Promise<CrmActivity> {
  const validatedData = crmActivitySchema.parse(data);

  const activity = await db.crmActivity.create({
    data: {
      ...validatedData,
      organizationId,
      memberId,
    },
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
        }
      }
    }
  });

  if (activity.record.customer) {
    revalidatePath(`/customers/${activity.record.customer.id}`);
  }
  if (activity.record.businessAccount) {
    revalidatePath(`/companies/${activity.record.businessAccount.id}`);
  }
  return activity;
}

export async function getActivities(recordId: string): Promise<any[]> {
  return await db.crmActivity.findMany({
    where: { recordId },
    orderBy: { createdAt: 'desc' },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });
}
