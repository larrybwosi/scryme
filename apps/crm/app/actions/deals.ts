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
      include: {
        targetAssociations: {
          include: {
            sourceRecord: {
              include: {
                customer: true,
                businessAccount: true,
              }
            }
          }
        }
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

export async function createDeal(input: any, organizationId: string) {
    try {
        const { associatedCustomerId, associatedCompanyId, ...data } = input;

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

        // Handle associations
        if (associatedCustomerId && associatedCustomerId !== 'none') {
            const customer = await db.customer.findUnique({ where: { id: associatedCustomerId } });
            if (customer?.crmRecordId) {
                await createAssociation(customer.crmRecordId, deal.id, 'contact_deals', organizationId);
            }
        }

        if (associatedCompanyId && associatedCompanyId !== 'none') {
            const company = await db.businessAccount.findUnique({ where: { id: associatedCompanyId } });
            if (company?.crmRecordId) {
                await createAssociation(company.crmRecordId, deal.id, 'company_deals', organizationId);
            }
        }

        revalidatePath('/pipeline');
        return { success: true, data: deal };
    } catch (error) {
        console.error('Error creating deal:', error);
        return { success: false, error: (error as any).message };
    }
}

async function createAssociation(sourceId: string, targetId: string, relationshipName: string, organizationId: string) {
    const rel = await db.crmRelationshipDefinition.findUnique({
        where: { organizationId_name: { organizationId, name: relationshipName } }
    });

    if (!rel) return;

    await db.crmAssociation.create({
        data: {
            relationshipId: rel.id,
            sourceRecordId: sourceId,
            targetRecordId: targetId,
        }
    });
}
