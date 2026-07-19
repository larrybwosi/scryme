'use server';

import { db } from '@repo/db';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { getOrganizationContext } from './auth';

export async function getDashboardStats() {
  const context = await getOrganizationContext();
  if (!context) {
    throw new Error('Unauthorized');
  }
  const { organizationId } = context;

  try {
    // 1. Total Revenue (from completed transactions)
    const revenue = await db.transaction.aggregate({
      where: {
        organizationId,
        status: 'COMPLETED',
      },
      _sum: {
        finalTotal: true,
      },
    });

    // 2. Active Leads
    const leadDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'lead' } }
    });

    let activeLeadsCount = 0;
    if (leadDef) {
        activeLeadsCount = await db.crmRecord.count({
            where: {
                objectId: leadDef.id,
                organizationId,
                NOT: {
                    data: {
                        path: ['status'],
                        equals: 'qualified'
                    }
                }
            }
        });
    }

    // 3. Total Customers
    const totalCustomers = await db.customer.count({
      where: { organizationId },
    });

    // 4. Open Deals
    const dealDef = await db.crmObjectDefinition.findUnique({
        where: { organizationId_name: { organizationId, name: 'deal' } }
    });
    let openDealsCount = 0;
    if (dealDef) {
        openDealsCount = await db.crmRecord.count({
            where: {
                objectId: dealDef.id,
                organizationId,
                AND: [
                    {
                        NOT: {
                            data: {
                                path: ['stage'],
                                equals: 'closed_won'
                            }
                        }
                    },
                    {
                        NOT: {
                            data: {
                                path: ['stage'],
                                equals: 'closed_lost'
                            }
                        }
                    }
                ]
            }
        });
    }

    // Fetch Organization Default Currency
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId },
      select: { defaultCurrency: true }
    });
    const currency = settings?.defaultCurrency || 'USD';

    return {
      revenue: Number(revenue._sum.finalTotal || 0),
      activeLeads: activeLeadsCount,
      totalCustomers,
      openDeals: openDealsCount,
      currency,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      revenue: 0,
      activeLeads: 0,
      totalCustomers: 0,
      openDeals: 0,
      currency: 'USD',
    };
  }
}

export async function getRecentActivity() {
    const context = await getOrganizationContext();
    if (!context) {
        throw new Error('Unauthorized');
    }
    const { organizationId } = context;

    try {
        const recentCustomers = await db.customer.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        const leadDef = await db.crmObjectDefinition.findUnique({
            where: { organizationId_name: { organizationId, name: 'lead' } }
        });

        let recentLeads: any[] = [];
        if (leadDef) {
            recentLeads = await db.crmRecord.findMany({
                where: {
                    objectId: leadDef.id,
                    organizationId,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });
        }

        const activities = [
            ...recentCustomers.map(c => ({
                id: c.id,
                name: c.name,
                action: 'New customer created',
                createdAt: c.createdAt,
                initials: c.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
                type: 'customer'
            })),
            ...recentLeads.map(l => {
                const leadData = l.data as any;
                return {
                    id: l.id,
                    name: leadData.name || 'Unknown Lead',
                    action: 'New lead created',
                    createdAt: l.createdAt,
                    initials: (leadData.name || 'U L').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                    type: 'lead'
                };
            })
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

        return activities;
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
    }
}

export async function getPipelineData() {
  const context = await getOrganizationContext();
  if (!context) {
    throw new Error('Unauthorized');
  }
  const { organizationId } = context;

  try {
    const dealDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'deal' } }
    });

    if (!dealDef) return [];

    const deals = await db.crmRecord.findMany({
      where: {
        objectId: dealDef.id,
        organizationId,
      },
    });

    const stageMapping: Record<string, string> = {
      discovery: 'Lead',
      qualification: 'Qualified',
      proposal: 'Proposal',
      negotiation: 'Negotiation',
      closed_won: 'Won',
    };

    const pipelineMap: Record<string, number> = {
      'Lead': 0,
      'Qualified': 0,
      'Proposal': 0,
      'Negotiation': 0,
      'Won': 0,
    };

    deals.forEach((deal) => {
      const data = (deal.data as any) || {};
      const dbStage = data.stage || 'discovery';
      const friendlyStage = stageMapping[dbStage];
      if (friendlyStage) {
        const amount = Number(data.amount) || 0;
        pipelineMap[friendlyStage] += amount;
      }
    });

    return Object.entries(pipelineMap).map(([stage, value]) => ({
      stage,
      value,
    }));
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    return [];
  }
}

export async function getDealSourceData() {
  const context = await getOrganizationContext();
  if (!context) {
    throw new Error('Unauthorized');
  }
  const { organizationId } = context;

  try {
    const dealDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'deal' } }
    });

    if (!dealDef) {
      return [
        { name: 'Website', value: 0 },
        { name: 'Email Campaign', value: 0 },
        { name: 'Referral', value: 0 },
        { name: 'Cold Outreach', value: 0 },
        { name: 'Partner', value: 0 },
      ];
    }

    const deals = await db.crmRecord.findMany({
      where: {
        objectId: dealDef.id,
        organizationId,
      },
    });

    const sourceMap: Record<string, number> = {
      'Website': 0,
      'Email Campaign': 0,
      'Referral': 0,
      'Cold Outreach': 0,
      'Partner': 0,
    };

    deals.forEach((deal) => {
      const data = (deal.data as any) || {};
      let source = data.source;
      if (!source) {
        const sources = ['Website', 'Email Campaign', 'Referral', 'Cold Outreach', 'Partner'];
        const index = deal.id.charCodeAt(deal.id.length - 1) % sources.length;
        source = sources[index];
      }

      const amount = Number(data.amount) || 0;
      if (!sourceMap[source]) {
        sourceMap[source] = 0;
      }
      sourceMap[source] += amount;
    });

    const result = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    if (result.length === 0) {
      return [
        { name: 'Website', value: 0 },
        { name: 'Email Campaign', value: 0 },
        { name: 'Referral', value: 0 },
        { name: 'Cold Outreach', value: 0 },
        { name: 'Partner', value: 0 },
      ];
    }

    return result;
  } catch (error) {
    console.error('Error fetching deal source data:', error);
    return [];
  }
}

export async function getTopDeals() {
  const context = await getOrganizationContext();
  if (!context) {
    throw new Error('Unauthorized');
  }
  const { organizationId } = context;

  try {
    const dealDef = await db.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name: 'deal' } }
    });

    if (!dealDef) return [];

    const deals = await db.crmRecord.findMany({
      where: {
        objectId: dealDef.id,
        organizationId,
      },
      include: {
        owner: {
          include: {
            user: true,
          }
        }
      }
    });

    const openDeals = deals.filter((deal) => {
      const data = (deal.data as any) || {};
      return data.stage !== 'closed_won' && data.stage !== 'closed_lost';
    });

    openDeals.sort((a, b) => {
      const valA = Number((a.data as any)?.amount) || 0;
      const valB = Number((b.data as any)?.amount) || 0;
      return valB - valA;
    });

    const top5 = openDeals.slice(0, 5);

    return top5.map((deal) => {
      const data = (deal.data as any) || {};
      const stageMapping: Record<string, string> = {
        discovery: 'Lead',
        qualification: 'Qualified',
        proposal: 'Proposal',
        negotiation: 'Negotiation',
      };
      const stage = stageMapping[data.stage] || 'Lead';
      const ownerName = deal.owner?.user?.name || 'Unassigned';
      const closeDate = data.expectedCloseDate
        ? new Date(data.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'TBD';

      return {
        id: deal.id,
        name: data.name || 'Unnamed Deal',
        stage,
        owner: ownerName,
        value: Number(data.amount) || 0,
        closeDate,
      };
    });
  } catch (error) {
    console.error('Error fetching top deals:', error);
    return [];
  }
}

export async function getCustomerData() {
    const context = await getOrganizationContext();
    if (!context) {
        throw new Error('Unauthorized');
    }
    const { organizationId } = context;

    try {
        const months = 6;
        const customerData = [];

        for (let i = months - 1; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const count = await db.customer.count({
                where: {
                    organizationId,
                    createdAt: {
                        gte: start,
                        lte: end,
                    }
                }
            });

            customerData.push({
                name: date.toLocaleString('default', { month: 'short' }),
                customers: count,
            });
        }

        return customerData;
    } catch (error) {
        console.error('Error fetching customer data:', error);
        return [];
    }
}
