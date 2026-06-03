'use server';

import { db } from '@repo/db';
import { crmActivitySchema, type CrmActivityFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createActivity(data: CrmActivityFormValues, organizationId: string, memberId?: string) {
  const validatedData = crmActivitySchema.parse(data);

  const activity = await db.crmActivity.create({
    data: {
      ...validatedData,
      organizationId,
      memberId,
    },
  });

  revalidatePath(`/customers/${activity.recordId}`);
  revalidatePath(`/companies/${activity.recordId}`);
  return activity;
}

export async function getActivities(recordId: string) {
  return await db.crmActivity.findMany({
    where: { recordId },
    orderBy: { createdAt: 'desc' },
    include: {
      member: true,
    },
  });
}
