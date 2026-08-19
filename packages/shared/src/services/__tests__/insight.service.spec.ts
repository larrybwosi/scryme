import { InsightService } from '../insight.service';

describe('InsightService', () => {
  let mockPrisma: any;
  let service: InsightService;

  beforeEach(() => {
    mockPrisma = {
      transaction: {
        findMany: jest.fn(),
      },
      crmRecord: {
        findFirst: jest.fn(),
      },
    };
    service = new InsightService(mockPrisma);
  });

  it('should parallelize queries and correctly calculate customer insights when data exists', async () => {
    const orgId = 'org_123';
    const custId = 'cust_456';
    const now = new Date();
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    mockPrisma.transaction.findMany.mockResolvedValue([
      { finalTotal: '100.00', createdAt: pastDate },
      { finalTotal: '200.00', createdAt: now },
    ]);

    mockPrisma.crmRecord.findFirst.mockResolvedValue({
      id: 'crm_1',
      activities: [{ id: 'act_1', createdAt: now }, { id: 'act_2', createdAt: now }],
    });

    const result = await service.getCustomerInsights(orgId, custId);

    // Verify DB calls were queried with expected filters
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: orgId,
        customerId: custId,
        status: 'COMPLETED',
      },
      select: {
        finalTotal: true,
        createdAt: true,
      },
    });

    expect(mockPrisma.crmRecord.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: orgId,
        customer: { id: custId },
      },
      select: {
        id: true,
        activities: {
          select: { id: true, createdAt: true },
        },
      },
    });

    // Verify calculated metrics
    expect(result.ltv).toBe(300);
    expect(result.aov).toBe(150);
    expect(result.purchaseCount).toBe(2);
    expect(result.lastPurchaseDate).toEqual(now);
    expect(typeof result.engagementScore).toBe('number');
  });

  it('should handle zero transactions and missing crm record gracefully', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    mockPrisma.crmRecord.findFirst.mockResolvedValue(null);

    const result = await service.getCustomerInsights('org_1', 'cust_1');

    expect(result.ltv).toBe(0);
    expect(result.aov).toBe(0);
    expect(result.purchaseCount).toBe(0);
    expect(result.engagementScore).toBe(0);
    expect(result.lastPurchaseDate).toBeNull();
  });
});
