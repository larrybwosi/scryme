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

    for (const workflow of activeWorkflows) {
      const nodes = (workflow.nodes as any[]) || [];
      const triggerNode = nodes.find((n) => n.type === "trigger");
      if (
        triggerNode &&
        (triggerNode.data?.event === event ||
          triggerNode.data?.label?.toLowerCase().includes(event.toLowerCase().replace(/_/g, " ")))
      ) {
        const customer = await db.customer.findUnique({
          where: { id: payload.customerId },
        });

        if (customer && customer.crmRecordId) {
          await db.campaignWorkflowInstance.create({
            data: {
              workflowId: workflow.id,
              recordId: customer.crmRecordId,
              status: "COMPLETED",
              currentNodeId: triggerNode.id,
              context: {
                triggeredByEvent: event,
                payload,
                executedAt: new Date().toISOString(),
              },
            },
          });
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error dispatching customer workflow trigger:", error);
    return { success: false, error: error.message };
  }
}
