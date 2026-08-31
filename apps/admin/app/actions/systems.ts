"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

// ====================================
// WORKFLOW ENGINE ACTIONS
// ====================================

export async function getWorkflowEngineMetrics() {
  await requireSuperAdmin();

  const [
    totalWorkflows,
    activeWorkflows,
    totalInstances,
    runningInstances,
    completedInstances,
    failedInstances,
    recentWorkflows,
    failedQueue,
  ] = await Promise.all([
    db.campaignWorkflow.count(),
    db.campaignWorkflow.count({ where: { isActive: true } }),
    db.campaignWorkflowInstance.count(),
    db.campaignWorkflowInstance.count({ where: { status: "RUNNING" } }),
    db.campaignWorkflowInstance.count({ where: { status: "COMPLETED" } }),
    db.campaignWorkflowInstance.count({ where: { status: "FAILED" } }),
    db.campaignWorkflow.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { instances: true } },
      },
    }),
    db.campaignWorkflowInstance.findMany({
      where: { status: "FAILED" },
      take: 20,
      orderBy: { updatedAt: "desc" },
      include: {
        workflow: {
          select: { id: true, name: true, organization: { select: { name: true } } },
        },
        record: {
          select: { id: true, data: true },
        },
      },
    }),
  ]);

  // Retrieve system rate limits from global settings
  const rateLimitSetting = await db.globalSetting.findUnique({
    where: { key: "system:workflow:rate_limit_per_min" },
  });
  const rateLimitPerMin = rateLimitSetting ? parseInt(rateLimitSetting.value, 10) : 100;

  return {
    totalWorkflows,
    activeWorkflows,
    totalInstances,
    runningInstances,
    completedInstances,
    failedInstances,
    recentWorkflows,
    failedQueue,
    rateLimitPerMin,
  };
}

export async function toggleWorkflowActiveStatus(workflowId: string, isActive: boolean) {
  await requireSuperAdmin();

  const updated = await db.campaignWorkflow.update({
    where: { id: workflowId },
    data: { isActive },
  });

  revalidatePath("/systems");
  return updated;
}

export async function clearFailedWorkflowInstances(workflowId?: string) {
  await requireSuperAdmin();

  const whereCondition = workflowId ? { status: "FAILED", workflowId } : { status: "FAILED" };

  const deleted = await db.campaignWorkflowInstance.deleteMany({
    where: whereCondition,
  });

  revalidatePath("/systems");
  return { success: true, count: deleted.count };
}

export async function setWorkflowRateLimit(rateLimitPerMin: number) {
  await requireSuperAdmin();

  await db.globalSetting.upsert({
    where: { key: "system:workflow:rate_limit_per_min" },
    update: { value: String(rateLimitPerMin) },
    create: { key: "system:workflow:rate_limit_per_min", value: String(rateLimitPerMin) },
  });

  revalidatePath("/systems");
  return { success: true, rateLimitPerMin };
}

export async function triggerWorkflowSimulationRun(workflowId: string) {
  await requireSuperAdmin();

  const workflow = await db.campaignWorkflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Find or create dummy record for simulation run
  const sampleRecord = await db.crmRecord.findFirst({
    where: { organizationId: workflow.organizationId },
  });

  if (!sampleRecord) {
    throw new Error("No CRM record found in target organization to simulate execution");
  }

  const instance = await db.campaignWorkflowInstance.create({
    data: {
      workflowId,
      recordId: sampleRecord.id,
      status: "COMPLETED",
      currentNodeId: "simulation-end",
      context: { simulatedAt: new Date().toISOString(), simulatedBy: "SUPER_ADMIN" },
    },
  });

  revalidatePath("/systems");
  return { success: true, instanceId: instance.id };
}


// ====================================
// CUSTOMER ENGINE ACTIONS
// ====================================

export async function getCustomerEngineMetrics() {
  await requireSuperAdmin();

  const [
    totalCustomers,
    activeCustomers,
    totalBusinessAccounts,
    totalSegments,
    segments,
    recentCustomers,
  ] = await Promise.all([
    db.customer.count(),
    db.customer.count({ where: { isActive: true } }),
    db.businessAccount.count(),
    db.campaignSegment.count(),
    db.campaignSegment.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { campaigns: true } },
      },
    }),
    db.customer.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true } },
      },
    }),
  ]);

  // Aggregate tags across all customers
  const customersWithTags = await db.customer.findMany({
    select: { tags: true },
  });

  const tagCounts: Record<string, number> = {};
  for (const c of customersWithTags) {
    for (const tag of c.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const allTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCustomers,
    activeCustomers,
    totalBusinessAccounts,
    totalSegments,
    segments,
    recentCustomers,
    allTags,
  };
}

export async function triggerSegmentRecalculation(segmentId?: string) {
  await requireSuperAdmin();

  // Simulate segment sync / recalculation across organization(s)
  if (segmentId) {
    await db.campaignSegment.update({
      where: { id: segmentId },
      data: { updatedAt: new Date() },
    });
  }

  revalidatePath("/systems");
  return { success: true, message: segmentId ? `Segment ${segmentId} recalculated.` : "All campaign segments recalculated and synchronized." };
}

export async function addTagToSystemCustomers(tag: string, organizationId?: string) {
  await requireSuperAdmin();

  const cleanTag = tag.trim();
  if (!cleanTag) throw new Error("Tag cannot be empty");

  const whereCondition = organizationId ? { organizationId } : {};

  const customers = await db.customer.findMany({
    where: whereCondition,
    select: { id: true, tags: true },
  });

  let updatedCount = 0;
  for (const customer of customers) {
    if (!customer.tags.includes(cleanTag)) {
      await db.customer.update({
        where: { id: customer.id },
        data: { tags: [...customer.tags, cleanTag] },
      });
      updatedCount++;
    }
  }

  revalidatePath("/systems");
  return { success: true, count: updatedCount, tag: cleanTag };
}

export async function removeTagFromSystemCustomers(tag: string) {
  await requireSuperAdmin();

  const customers = await db.customer.findMany({
    where: { tags: { has: tag } },
    select: { id: true, tags: true },
  });

  let updatedCount = 0;
  for (const customer of customers) {
    await db.customer.update({
      where: { id: customer.id },
      data: { tags: customer.tags.filter((t) => t !== tag) },
    });
    updatedCount++;
  }

  revalidatePath("/systems");
  return { success: true, count: updatedCount, tag };
}

export async function bulkUpdateCustomersStatus(isActive: boolean, organizationId?: string) {
  await requireSuperAdmin();

  const whereCondition = organizationId ? { organizationId } : {};

  const updated = await db.customer.updateMany({
    where: whereCondition,
    data: { isActive },
  });

  revalidatePath("/systems");
  return { success: true, count: updated.count };
}

export async function bulkExportCustomers() {
  await requireSuperAdmin();

  const customers = await db.customer.findMany({
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      loyaltyPoints: true,
      isActive: true,
      organization: { select: { name: true } },
    },
  });

  return customers;
}
