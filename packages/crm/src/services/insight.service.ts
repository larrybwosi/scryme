import "server-only";
import { PrismaClient } from "@repo/db";

export class InsightService {
  constructor(private prisma: PrismaClient) {}

  async getCustomerInsights(organizationId: string, customerId: string) {
    // 1. Get Transaction Data
    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        customerId,
        status: "COMPLETED",
      },
      select: {
        finalTotal: true,
        createdAt: true,
      },
    });

    const totalSpent = transactions.reduce(
      (acc: number, tx: { finalTotal: any }) => acc + Number(tx.finalTotal),
      0,
    );
    const purchaseCount = transactions.length;
    const avgOrderValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

    // 2. Get Activity Data
    const crmRecord = await this.prisma.crmRecord.findFirst({
      where: {
        organizationId,
        customer: { id: customerId },
      },
      select: {
        id: true,
        activities: {
          select: { id: true, createdAt: true },
        },
      },
    });

    const activityCount = crmRecord?.activities.length || 0;

    // 3. Calculate Engagement Score
    // Formula: (Frequency * 0.5) + (Recency * 0.3) + (Activity * 0.2)
    // Normalized to 0-100

    let recencyScore = 0;
    if (transactions.length > 0) {
      const lastPurchase = new Date(
        Math.max(
          ...transactions.map((t: { createdAt: Date }) =>
            t.createdAt.getTime(),
          ),
        ),
      );
      const daysSinceLastPurchase =
        (Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
      recencyScore = Math.max(0, 100 - daysSinceLastPurchase); // Simple decay
    }

    const frequencyScore = Math.min(100, purchaseCount * 10);
    const activityScore = Math.min(100, activityCount * 5);

    const engagementScore =
      frequencyScore * 0.5 + recencyScore * 0.3 + activityScore * 0.2;

    return {
      ltv: totalSpent,
      aov: avgOrderValue,
      purchaseCount,
      engagementScore: Math.round(engagementScore),
      lastPurchaseDate:
        transactions.length > 0
          ? new Date(
              Math.max(
                ...transactions.map((t: { createdAt: Date }) =>
                  t.createdAt.getTime(),
                ),
              ),
            )
          : null,
    };
  }
}
