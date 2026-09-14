"use server";

import { db } from "@repo/db";
import { ScrymeChatApiClient } from "@repo/chat";

export async function dispatchCustomerWorkflowTrigger(
  organizationId: string,
  event: "CUSTOMER_CREATED" | "CUSTOMER_TIER_CHANGED" | "CUSTOMER_CHURN_RISK_HIGH",
  payload: {
    customerId: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    tier?: string;
    churnScore?: number;
    riskLevel?: string;
    details?: string;
  }
) {
  try {
    // 1. Check if organization has Scryme Chat integration configured
    const scrymeConfig = await db.scrymeConfiguration.findUnique({
      where: { organizationId },
    });

    if (scrymeConfig?.isActive && scrymeConfig.workspaceSlug) {
      const chatClient = new ScrymeChatApiClient();
      const channel = "customer-events";
      const icon =
        event === "CUSTOMER_CHURN_RISK_HIGH"
          ? "⚠️"
          : event === "CUSTOMER_TIER_CHANGED"
          ? "🌟"
          : "👤";

      const message = `${icon} **Customer Alert: ${event}**\n- **Name**: ${payload.customerName}\n- **Email**: ${payload.customerEmail || "N/A"}\n${
        payload.tier ? `- **Tier**: ${payload.tier}\n` : ""
      }${
        payload.churnScore !== undefined ? `- **Churn Score**: ${payload.churnScore}/100 (${payload.riskLevel})\n` : ""
      }${payload.details ? `- **Notes**: ${payload.details}\n` : ""}`;

      await chatClient.sendMessage(scrymeConfig.workspaceSlug, channel, {
        content: message,
      }).catch((err: any) => {
        console.warn("Failed to dispatch Scryme Chat notification:", err.message);
      });
    }

    // 2. Trigger CampaignWorkflows listening for this trigger event
    const activeWorkflows = await db.campaignWorkflow.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // Filter active workflows matching the trigger event
    const matchingWorkflows = activeWorkflows.filter((workflow) => {
      const nodes = (workflow.nodes as any[]) || [];
      const triggerNode = nodes.find((n) => n.type === "trigger");
      return (
        triggerNode &&
        (triggerNode.data?.event === event ||
          triggerNode.data?.label?.toLowerCase().includes(event.toLowerCase().replace(/_/g, " ")))
      );
    });

    if (matchingWorkflows.length > 0) {
      // ⚡ Bolt Performance Optimization:
      // 1. Hoist db.customer.findUnique out of the iteration loop to query customer record ONCE (O(1) vs O(N) DB calls).
      // 2. Parallelize campaignWorkflowInstance.create calls using Promise.all to collapse execution latency from O(N) sequential roundtrips to 1 parallel roundtrip.
      const customer = await db.customer.findUnique({
        where: { id: payload.customerId },
      });

      if (customer && customer.crmRecordId) {
        await Promise.all(
          matchingWorkflows.map((workflow) => {
            const nodes = (workflow.nodes as any[]) || [];
            const triggerNode = nodes.find((n) => n.type === "trigger")!;
            return db.campaignWorkflowInstance.create({
              data: {
                workflowId: workflow.id,
                recordId: customer.crmRecordId!,
                status: "COMPLETED",
                currentNodeId: triggerNode.id,
                context: {
                  triggeredByEvent: event,
                  payload,
                  executedAt: new Date().toISOString(),
                },
              },
            });
          })
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error dispatching customer workflow trigger:", error);
    return { success: false, error: error.message };
  }
}
