import { PrismaClient } from "@repo/db";
import { ScrymeChatApiClient } from "@repo/scryme";
import { addHours, subHours, isBefore, isAfter } from "date-fns";

/**
 * Service to process CRM follow-up reminders and escalations.
 * This should be called by a Windmill cron job or periodically.
 */
export class FollowUpReminderService {
  private scrymeClient = new ScrymeChatApiClient();

  constructor(private prisma: PrismaClient) {}

  async processReminders() {
    const now = new Date();
    const reminderWindowStart = addHours(now, 2);
    const reminderWindowEnd = addHours(now, 2.5); // 30min window to avoid missing due to cron timing

    // 1. Find follow-ups due in ~2 hours that haven't had a reminder sent
    const followUpsToNotify = await this.prisma.crmFollowUp.findMany({
      where: {
        status: "PENDING",
        reminderSent: false,
        dueDate: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
      },
      include: {
        organization: {
          include: {
            scrymeConfiguration: true,
          },
        },
        record: {
          include: {
            customer: true,
          },
        },
        location: true,
      },
    });

    for (const followUp of followUpsToNotify) {
      await this.sendNotification(followUp);
      await this.prisma.crmFollowUp.update({
        where: { id: followUp.id },
        data: { reminderSent: true },
      });
    }

    // 2. Handle Escalations (Overdue and not completed)
    const overdueFollowUps = await this.prisma.crmFollowUp.findMany({
      where: {
        status: "PENDING",
        escalationSent: false,
        dueDate: {
          lt: now,
        },
      },
      include: {
        organization: {
          include: {
            scrymeConfiguration: true,
          },
        },
        record: {
          include: {
            customer: true,
          },
        },
        location: true,
      },
    });

    for (const followUp of overdueFollowUps) {
      await this.sendEscalation(followUp);
      await this.prisma.crmFollowUp.update({
        where: { id: followUp.id },
        data: {
          escalationSent: true,
          status: "OVERDUE"
        },
      });
    }

    return {
      remindersSent: followUpsToNotify.length,
      escalationsSent: overdueFollowUps.length,
    };
  }

  private async sendNotification(followUp: any) {
    const { organization, record, location } = followUp;
    const config = organization.scrymeConfiguration;

    if (!config || !config.workspaceSlug || !config.isActive) return;

    const customerName = record.customer?.name || "Unknown Customer";
    const appUrl = process.env.PUBLIC_APP_URL || "https://app.dealio.cm";
    const crmLink = record.customer
      ? `${appUrl}/crm/customers/${record.customer.id}`
      : `${appUrl}/crm/records/${record.id}`;

    const message = {
      content: `🔔 *Upcoming Follow-up Reminder*\n\n*Customer:* ${customerName}\n*Subject:* ${followUp.title}\n*Due:* ${followUp.dueDate.toLocaleString()}\n*Type:* ${followUp.type}\n\n[View CRM Record](${crmLink})`,
      actions: [
        {
          id: `view_record:${followUp.id}`,
          label: "View in CRM",
          type: "button" as const,
          value: crmLink
        }
      ]
    };

    // Notify Branch Channel
    if (location?.scrymeChannelId) {
      try {
        await this.scrymeClient.sendMessage(config.workspaceSlug, location.scrymeChannelId, message);
      } catch (err) {
        console.error(`Failed to send branch notification to Scryme for follow-up ${followUp.id}:`, err);
      }
    }

    // Notify Admins Channel (Targeting a channel named 'admins' by default if not specified)
    try {
      await this.scrymeClient.sendMessage(config.workspaceSlug, "admins", {
        ...message,
        content: `📢 *Admin Alert: Upcoming Follow-up*\n\n${message.content}`
      });
    } catch (err) {
      console.error(`Failed to send admin notification to Scryme for follow-up ${followUp.id}:`, err);
    }
  }

  private async sendEscalation(followUp: any) {
    const { organization, record } = followUp;
    const config = organization.scrymeConfiguration;

    if (!config || !config.workspaceSlug || !config.isActive) return;

    const customerName = record.customer?.name || "Unknown Customer";
    const appUrl = process.env.PUBLIC_APP_URL || "https://app.dealio.cm";
    const crmLink = record.customer
      ? `${appUrl}/crm/customers/${record.customer.id}`
      : `${appUrl}/crm/records/${record.id}`;

    const message = {
      content: `⚠️ *OVERDUE Follow-up Alert*\n\n*Customer:* ${customerName}\n*Subject:* ${followUp.title}\n*Was Due:* ${followUp.dueDate.toLocaleString()}\n*Priority:* ${followUp.priority}\n\nThis follow-up is now overdue and requires immediate attention.\n\n[View CRM Record](${crmLink})`,
      actions: [
        {
          id: `view_record:${followUp.id}`,
          label: "Resolve Now",
          type: "button" as const,
          value: crmLink,
          style: "danger" as const
        }
      ]
    };

    // Send to Admins for escalation
    try {
      await this.scrymeClient.sendMessage(config.workspaceSlug, "admins", message);
    } catch (err) {
      console.error(`Failed to send escalation to Scryme for follow-up ${followUp.id}:`, err);
    }
  }
}
