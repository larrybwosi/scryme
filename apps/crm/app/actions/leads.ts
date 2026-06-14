'use server';

import { db } from '@repo/db';
import { revalidatePath } from 'next/cache';

export async function getLeads(organizationId: string) {
  try {
    const leadDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'lead' } }
    });

    if (!leadDef) return [];

    return await db.crmRecord.findMany({
      where: {
        objectId: leadDef.id,
        organizationId,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
}

export async function createLead(data: any, organizationId: string) {
  try {
    const leadDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'lead' } }
    });

    if (!leadDef) throw new Error('Lead definition not found');

    const lead = await db.crmRecord.create({
      data: {
        objectId: leadDef.id,
        organizationId,
        data: {
            ...data,
            status: data.status || 'new'
        },
      },
      include: { objectDefinition: true }
    });

    revalidatePath('/leads');
    return { success: true, data: lead };
  } catch (error) {
    console.error('Error creating lead:', error);
    return { success: false, error: (error as any).message };
  }
}

export async function qualifyLead(leadId: string, organizationId: string, options?: { createDeal?: boolean, dealName?: string, dealAmount?: number }) {
  try {
    const lead = await db.crmRecord.findUnique({
      where: { id: leadId },
      include: { objectDefinition: true }
    });

    if (!lead) throw new Error('Lead not found');

    const leadData = lead.data as any;

    // 1. Create a Customer (Contact)
    const customer = await db.customer.create({
        data: {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            company: leadData.company,
            organizationId,
            customerType: leadData.company ? 'B2B' : 'B2C',
        }
    });

    // 2. Optional: Create a Deal
    if (options?.createDeal) {
        const dealDef = await db.crmObjectDefinition.findUnique({
            where: { organizationId_name: { organizationId, name: 'deal' } }
        });

        if (dealDef) {
            const deal = await db.crmRecord.create({
                data: {
                    objectId: dealDef.id,
                    organizationId,
                    data: {
                        name: options.dealName || `Deal for ${leadData.name}`,
                        amount: options.dealAmount || 0,
                        stage: 'qualification',
                    }
                }
            });

            // Associate customer with deal
            const customerRecord = await db.customer.findUnique({ where: { id: customer.id } });
            if (customerRecord?.crmRecordId) {
                const rel = await db.crmRelationshipDefinition.findUnique({
                    where: { organizationId_name: { organizationId, name: 'contact_deals' } }
                });
                if (rel) {
                    await db.crmAssociation.create({
                        data: {
                            relationshipId: rel.id,
                            sourceRecordId: customerRecord.crmRecordId,
                            targetRecordId: deal.id,
                        }
                    });
                }
            }
        }
    }

    // 3. Update lead status to qualified
    await db.crmRecord.update({
        where: { id: leadId },
        data: {
            data: {
                ...leadData,
                status: 'qualified'
            }
        }
    });

    revalidatePath('/leads');
    revalidatePath('/customers');
    revalidatePath('/contacts');
    revalidatePath('/pipeline');

    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error('Error qualifying lead:', error);
    return { success: false, error: (error as any).message };
  }
}
