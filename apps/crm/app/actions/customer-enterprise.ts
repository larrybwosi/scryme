"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dispatchCustomerWorkflowTrigger } from "./customer-workflow-triggers";

export interface CustomerHealthScore {
  score: number; // 0 - 100
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

export interface CustomerTierInfo {
  tier: "STANDARD" | "SILVER" | "GOLD" | "PLATINUM" | "VIP";
  tierDiscount: number; // percentage
  loyaltyMultiplier: number;
}

export async function calculateCustomerHealthScore(
  customerId: string
): Promise<CustomerHealthScore> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId },
    include: {
      transactions: {
        select: {
          id: true,
          finalTotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      crmRecord: {
        include: {
          activities: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const transactions = (customer as any).transactions || [];
  const orderCount = transactions.length;
  const totalSpent = transactions.reduce((acc: number, tx: any) => acc + (Number(tx.finalTotal) || 0), 0);

  const now = new Date();
  const lastOrderDate = transactions.length > 0 ? new Date(transactions[0].createdAt) : null;
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // 1. Recency Score (0 - 30 points)
  let recencyScore = 0;
  if (daysSinceLastOrder === null) {
    recencyScore = 5; // New / no order customer
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

  // 4. Activity Score (0 - 10 points based on recent CRM activity)
  const crmRecord = (customer as any).crmRecord;
  const activities = crmRecord?.activities || [];
  let activityScore = 0;
  if (activities.length >= 5) activityScore = 10;
  else if (activities.length >= 2) activityScore = 6;
  else if (activities.length >= 1) activityScore = 3;

  const totalScore = Math.min(100, recencyScore + frequencyScore + monetaryScore + activityScore);

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (totalScore < 25 || (daysSinceLastOrder !== null && daysSinceLastOrder > 120)) {
    riskLevel = "CRITICAL";
  } else if (totalScore < 50 || (daysSinceLastOrder !== null && daysSinceLastOrder > 75)) {
    riskLevel = "HIGH";
  } else if (totalScore < 75) {
    riskLevel = "MEDIUM";
  }

  // Trigger high churn risk event if risk is HIGH or CRITICAL
  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    await dispatchCustomerWorkflowTrigger(organizationId, "CUSTOMER_CHURN_RISK_HIGH", {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      churnScore: totalScore,
      riskLevel,
      details: `Customer health score evaluated at ${totalScore}/100. Days since last order: ${daysSinceLastOrder ?? "N/A"}.`,
    });
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

export async function updateCustomerTier(
  customerId: string,
  tier: "STANDARD" | "SILVER" | "GOLD" | "PLATINUM" | "VIP"
): Promise<{ success: boolean; data?: any; error?: string }> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const customer = await db.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    const currentTags = customer.tags || [];
    const tierTags = ["STANDARD", "SILVER", "GOLD", "PLATINUM", "VIP"];
    const filteredTags = currentTags.filter((t) => !tierTags.includes(t.toUpperCase()));
    filteredTags.push(tier);

    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        tags: filteredTags,
      },
    });

    // Fire Workflow & Chat Trigger for tier change
    await dispatchCustomerWorkflowTrigger(organizationId, "CUSTOMER_TIER_CHANGED", {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      tier,
      details: `Customer tier updated to ${tier}.`,
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    return { success: true, data: updatedCustomer };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update customer tier" };
  }
}

export async function bulkUpdateCustomerTier(
  customerIds: string[],
  tier: "STANDARD" | "SILVER" | "GOLD" | "PLATINUM" | "VIP"
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const tierTags = ["STANDARD", "SILVER", "GOLD", "PLATINUM", "VIP"];
    const customers = await db.customer.findMany({
      where: {
        id: { in: customerIds },
        organizationId,
      },
      select: { id: true, name: true, email: true, phone: true, tags: true },
    });

    await Promise.all(
      customers.map(async (c) => {
        const filtered = (c.tags || []).filter((t) => !tierTags.includes(t.toUpperCase()));
        filtered.push(tier);
        await db.customer.update({
          where: { id: c.id },
          data: { tags: filtered },
        });

        await dispatchCustomerWorkflowTrigger(organizationId, "CUSTOMER_TIER_CHANGED", {
          customerId: c.id,
          customerName: c.name,
          customerEmail: c.email,
          customerPhone: c.phone,
          tier,
          details: `Batch update customer tier to ${tier}.`,
        });
      })
    );

    revalidatePath("/customers");
    return { success: true, updatedCount: customers.length };
  } catch (error: any) {
    return { success: false, updatedCount: 0, error: error.message || "Failed bulk tier update" };
  }
}

export async function updateCustomerCustomFields(
  customerId: string,
  customAttributes: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const customer = await db.customer.findFirst({
      where: { id: customerId, organizationId },
      include: { crmRecord: true },
    });

    if (!customer || !(customer as any).crmRecord) {
      return { success: false, error: "Customer CRM record not found" };
    }

    const crmRecord = (customer as any).crmRecord;
    const currentData = (crmRecord.data as Record<string, any>) || {};
    await db.crmRecord.update({
      where: { id: crmRecord.id },
      data: {
        data: {
          ...currentData,
          customFields: {
            ...((currentData.customFields as Record<string, any>) || {}),
            ...customAttributes,
          },
        },
      },
    });

    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportCustomersCSV(filter?: {
  tier?: string;
  search?: string;
}): Promise<string> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const customers = await db.customer.findMany({
    where: { organizationId },
    select: {
      id: true,
      customId: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      customerType: true,
      tags: true,
      isActive: true,
      loyaltyPoints: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID",
    "CustomID",
    "Name",
    "Email",
    "Phone",
    "Company",
    "Type",
    "Tags",
    "IsActive",
    "LoyaltyPoints",
    "CreatedAt",
  ];

  const rows = customers.map((c) => [
    c.id,
    c.customId || "",
    `"${(c.name || "").replace(/"/g, '""')}"`,
    c.email || "",
    c.phone || "",
    `"${(c.company || "").replace(/"/g, '""')}"`,
    c.customerType || "B2C",
    `"${(c.tags || []).join(";")}"`,
    c.isActive ? "TRUE" : "FALSE",
    c.loyaltyPoints || 0,
    c.createdAt.toISOString(),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function importCustomersCSV(csvContent: string): Promise<{
  success: boolean;
  importedCount: number;
  errors: string[];
}> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const lines = csvContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) {
    return { success: false, importedCount: 0, errors: ["Empty or invalid CSV file"] };
  }

  const errors: string[] = [];
  let importedCount = 0;

  const dataLines = lines.slice(1);

  // Performance Optimization: Parallelized CSV row processing in controlled chunks of 10 using Promise.all.
  // Chunking prevents database connection pool exhaustion while reducing total latency from O(N) sequential roundtrips to O(N/10) concurrent batch roundtrips.
  const CHUNK_SIZE = 10;
  for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
    const chunk = dataLines.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map(async (line, chunkIdx) => {
        const index = i + chunkIdx;
        const cols = line.split(",").map((col) => col.trim().replace(/^"|"$/g, ""));
        const name = cols[0] || cols[2];
        const email = cols[1] || cols[3] || null;
        const phone = cols[2] || cols[4] || null;
        const company = cols[5] || null;

        if (!name || name.trim() === "") {
          return { success: false, error: `Row ${index + 2}: Missing customer name` };
        }

        try {
          const created = await db.customer.create({
            data: {
              name,
              email: email === "" ? null : email,
              phone: phone === "" ? null : phone,
              company: company === "" ? null : company,
              organizationId,
              tags: ["IMPORTED"],
              creationType: "IMPORTED",
            },
          });

          await dispatchCustomerWorkflowTrigger(organizationId, "CUSTOMER_CREATED", {
            customerId: created.id,
            customerName: created.name,
            customerEmail: created.email,
            customerPhone: created.phone,
            details: "Customer registered via bulk CSV import.",
          });

          return { success: true };
        } catch (err: any) {
          return { success: false, error: `Row ${index + 2}: ${err.message}` };
        }
      })
    );

    for (const res of results) {
      if (res.success) {
        importedCount++;
      } else if (res.error) {
        errors.push(res.error);
      }
    }
  }

  revalidatePath("/customers");
  return { success: true, importedCount, errors };
}
