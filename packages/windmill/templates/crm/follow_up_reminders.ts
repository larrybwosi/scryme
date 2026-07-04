import { PrismaClient } from "@repo/db";
import { FollowUpReminderService } from "@repo/shared/services/customer";

/**
 * Windmill Workflow: CRM Follow-up Reminder Processor
 * This script scans for upcoming follow-ups and sends notifications to Scryme Chat.
 * It also handles overdue escalations.
 *
 * Schedule: Every 15-30 minutes.
 */
export async function main() {
  const prisma = new PrismaClient();
  const service = new FollowUpReminderService(prisma);

  console.log("Starting CRM follow-up reminder processing...");

  try {
    const result = await service.processReminders();
    console.log(`Processing complete. Sent ${result.remindersSent} reminders and ${result.escalationsSent} escalations.`);
    return result;
  } catch (error) {
    console.error("Failed to process follow-up reminders:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
