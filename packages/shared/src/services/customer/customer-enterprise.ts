export interface CustomerHealthMetrics {
  orderCount: number;
  totalSpent: number;
  daysSinceLastOrder: number | null;
  activityCount: number;
}

export interface CustomerHealthResult {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metrics: {
    orderCount: number;
    totalSpent: number;
    daysSinceLastOrder: number | null;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    activityScore: number;
  };
}

export function computeCustomerHealthScore(metrics: CustomerHealthMetrics): CustomerHealthResult {
  const { orderCount, totalSpent, daysSinceLastOrder, activityCount } = metrics;

  // 1. Recency Score (0 - 30 points)
  let recencyScore = 0;
  if (daysSinceLastOrder === null) {
    recencyScore = 5;
  } else if (daysSinceLastOrder <= 30) {
    recencyScore = 30;
  } else if (daysSinceLastOrder <= 60) {
    recencyScore = 20;
  } else if (daysSinceLastOrder <= 90) {
    recencyScore = 10;
  } else if (daysSinceLastOrder <= 180) {
    recencyScore = 5;
  } else {
    recencyScore = 0;
  }

  // 2. Frequency Score (0 - 30 points)
  let frequencyScore = 0;
  if (orderCount >= 20) frequencyScore = 30;
  else if (orderCount >= 10) frequencyScore = 25;
  else if (orderCount >= 5) frequencyScore = 20;
  else if (orderCount >= 2) frequencyScore = 12;
  else if (orderCount >= 1) frequencyScore = 5;

  // 3. Monetary Score (0 - 30 points)
  let monetaryScore = 0;
  if (totalSpent >= 10000) monetaryScore = 30;
  else if (totalSpent >= 5000) monetaryScore = 25;
  else if (totalSpent >= 2000) monetaryScore = 20;
  else if (totalSpent >= 500) monetaryScore = 15;
  else if (totalSpent > 0) monetaryScore = 5;

  // 4. Activity Score (0 - 10 points)
  let activityScore = 0;
  if (activityCount >= 5) activityScore = 10;
  else if (activityCount >= 2) activityScore = 6;
  else if (activityCount >= 1) activityScore = 3;

  const totalScore = Math.min(100, recencyScore + frequencyScore + monetaryScore + activityScore);

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (totalScore < 25 || (daysSinceLastOrder !== null && daysSinceLastOrder > 120)) {
    riskLevel = "CRITICAL";
  } else if (totalScore < 50 || (daysSinceLastOrder !== null && daysSinceLastOrder > 75)) {
    riskLevel = "HIGH";
  } else if (totalScore < 75) {
    riskLevel = "MEDIUM";
  }

  return {
    score: totalScore,
    riskLevel,
    metrics: {
      orderCount,
      totalSpent,
      daysSinceLastOrder,
      recencyScore,
      frequencyScore,
      monetaryScore,
      activityScore,
    },
  };
}

export function parseCustomerCsv(csvContent: string): { name: string; email: string | null; phone: string | null; company: string | null }[] {
  const lines = csvContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) return [];

  const dataLines = lines.slice(1);
  const records = [];

  for (const line of dataLines) {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const name = cols[0] || cols[2];
    const email = cols[1] || cols[3] || null;
    const phone = cols[2] || cols[4] || null;
    const company = cols[5] || null;

    if (name) {
      records.push({
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
      });
    }
  }

  return records;
}
