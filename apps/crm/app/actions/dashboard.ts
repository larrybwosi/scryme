'use server';

import { db } from '@repo/db';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { getOrganizationContext } from './auth';

async function verifyOrg(organizationId: string) {
  const context = await getOrganizationContext();
  if (!context || context.organizationId !== organizationId) {
    throw new Error('Unauthorized');
  }
}

export async function getDashboardStats(organizationId: string) {
  await verifyOrg(organizationId);

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

    return {
      revenue: Number(revenue._sum.finalTotal || 0),
      activeLeads: activeLeadsCount,
      totalCustomers,
      openDeals: openDealsCount,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      revenue: 0,
      activeLeads: 0,
      totalCustomers: 0,
      openDeals: 0,
    };
  }
}

export async function getRecentActivity(organizationId: string) {
    await verifyOrg(organizationId);

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

export async function getSalesData(organizationId: string) {
    await verifyOrg(organizationId);

    try {
        const months = 6;
        const salesData = [];

        for (let i = months - 1; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const revenue = await db.transaction.aggregate({
                where: {
                    organizationId,
                    status: 'COMPLETED',
                    createdAt: {
                        gte: start,
                        lte: end,
                    }
                },
                _sum: {
                    finalTotal: true,
                }
            });

            salesData.push({
                name: date.toLocaleString('default', { month: 'short' }),
                sales: Number(revenue._sum.finalTotal || 0),
            });
        }

        return salesData;
    } catch (error) {
        console.error('Error fetching sales data:', error);
        return [];
    }
}
