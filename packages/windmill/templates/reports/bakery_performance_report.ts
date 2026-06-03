// fallow-ignore-next-line unused-files
import { db } from '@repo/db';
import { sendNotification } from '../src/services/notification';

/**
 * @name Weekly Bakery Performance Insights
 * @description Calculates bakery performance metrics for the last 7 days and sends a structured report to the owners via Discord.
 */
export async function main(
  data: {
    organizationId: string;
    includeWasteDetails?: boolean;
    reportFormat: 'detailed' | 'summary';
  }
) {
  const { organizationId, includeWasteDetails = false, reportFormat = 'summary' } = data;
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  console.log(`Generating bakery performance report for organization: ${organizationId} since ${lastWeek.toISOString()}`);

  // 1. Fetch Batch Metrics
  const batches = await db.batch.findMany({
    where: {
      organizationId,
      scheduledStartAt: { gte: lastWeek }
    },
    select: {
      status: true,
      actualQuantity: true,
      wasteQuantity: true,
      recipe: {
        select: {
          name: true
        }
      }
    }
  });

  const completedBatches = batches.filter(b => b.status === 'COMPLETED');
  const cancelledBatches = batches.filter(b => b.status === 'CANCELLED');

  const totalWaste = completedBatches.reduce((acc, b) => acc + Number(b.wasteQuantity || 0), 0);
  const totalProduced = completedBatches.reduce((acc, b) => acc + Number(b.actualQuantity || 0), 0);

  // 2. Calculate Top Recipes
  const recipeCounts: Record<string, number> = {};
  completedBatches.forEach(b => {
    const name = b.recipe.name;
    recipeCounts[name] = (recipeCounts[name] || 0) + 1;
  });

  const topRecipes = Object.entries(recipeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // 3. Construct Notification Data
  const reportData = {
    period: "Last 7 Days",
    format: reportFormat,
    completedCount: completedBatches.length,
    cancelledCount: cancelledBatches.length,
    totalProduced: totalProduced.toFixed(2),
    totalWaste: totalWaste.toFixed(2),
    wastePercentage: totalProduced > 0 ? ((totalWaste / totalProduced) * 100).toFixed(1) : "0",
    topRecipes: topRecipes,
    includeWasteDetails,
    timestamp: new Date().toISOString()
  };

  // 4. Send Notification
  await sendNotification({
    organizationId,
    templateName: 'bakery-weekly-performance',
    data: reportData,
    channels: ['DISCORD'],
    recipients: {
      roles: ['OWNER', 'ADMIN']
    }
  });

  return {
    success: true,
    metrics: reportData
  };
}
