'use server';

import { db } from '@repo/db';
import { crmActivitySchema, type CrmActivityFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';
import { getCurrentMember } from './auth';

export async function createActivity(data: CrmActivityFormValues, organizationId: string, memberId?: string | null) {
  const validatedData = crmActivitySchema.parse(data);

  let activeMemberId = memberId;
  if (!activeMemberId) {
    const currentMember = await getCurrentMember();
    activeMemberId = currentMember?.id || null;
  }

  const activity = await db.crmActivity.create({
    data: {
      ...validatedData,
      organizationId,
      memberId: activeMemberId,
    },
    include: {
        record: {
            include: {
                customer: true,
                businessAccount: true,
                objectDefinition: true,
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
  if (activity.record.objectDefinition.name === 'deal') {
    revalidatePath(`/pipeline/${activity.recordId}`);
  }
  if (activity.record.objectDefinition.name === 'lead') {
    revalidatePath(`/leads/${activity.recordId}`);
  }

  return activity;
}
