'use server';

import { db } from '@repo/db';
import { revalidatePath } from 'next/cache';

export async function getDeals(organizationId: string) {
  try {
    const dealDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'deal' } }
    });

    if (!dealDef) return [];

    return await db.crmRecord.findMany({
      where: {
        objectId: dealDef.id,
        organizationId,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

export async function updateDealStage(dealId: string, stage: string) {
  try {
    const deal = await db.crmRecord.findUnique({
      where: { id: dealId },
    });

    if (!deal) throw new Error('Deal not found');

    const data = (deal.data as any) || {};

    await db.crmRecord.update({
      where: { id: dealId },
      data: {
        data: {
          ...data,
          stage,
        }
      }
    });

    revalidatePath('/pipeline');
    return { success: true };
  } catch (error) {
    console.error('Error updating deal stage:', error);
    return { success: false };
  }
}

export async function createDeal(data: any, organizationId: string) {
    try {
        const dealDef = await db.crmObjectDefinition.findUnique({
            where: { organizationId_name: { organizationId, name: 'deal' } }
        });

        if (!dealDef) throw new Error('Deal definition not found');

        const deal = await db.crmRecord.create({
            data: {
                objectId: dealDef.id,
                organizationId,
                data,
            }
        });

        revalidatePath('/pipeline');
        return { success: true, data: deal };
    } catch (error) {
        console.error('Error creating deal:', error);
        return { success: false };
    }
}
