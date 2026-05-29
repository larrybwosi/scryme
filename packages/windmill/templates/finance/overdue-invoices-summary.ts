import { db as prisma } from '@repo/db';
import { NotificationEngine } from '@repo/notifications';

const notificationEngine = new NotificationEngine();

/**
 * Windmill Script: Overdue Invoices Summary
 *
 * This script sends a summary of overdue invoices to admins who have opted in.
 */
export async function main(data: {
  organizationId: string;
  orgName: string;
  count: number;
  totalAmount: number;
  invoices: Array<{
    id: string;
    customer: string;
    amount: number;
    dueDate: string;
  }>;
}) {
  const { organizationId, orgName, count, totalAmount, invoices } = data;

  // 1. Find all Admins/Managers for this organization
  const admins = await prisma.member.findMany({
    where: {
      organizationId,
      role: { in: ['ADMIN', 'MANAGER'] },
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  // 2. Filter by those who have opted in for invoiceReminders
  const optedInAdmins = admins.filter(admin => {
    const prefs = admin.user.notificationPrefs as any;
    // Default to true if not set, or check explicit preference
    return prefs?.invoiceReminders !== false;
  });

  if (optedInAdmins.length === 0) {
    console.log(`No opted-in admins found for Org ${organizationId}`);
    return { success: true, message: 'No recipients opted in' };
  }

  const recipientUserIds = optedInAdmins.map(a => a.userId);

  // 3. Send notification via NotificationEngine
  await notificationEngine.notify({
    organizationId,
    templateName: 'OVERDUE_INVOICES_SUMMARY',
    data: {
      orgName,
      count,
      totalAmount,
      invoices,
    },
    recipients: {
      userIds: recipientUserIds,
    },
    channels: ['WEBHOOK', 'DISCORD'],
  });

  return {
    success: true,
    recipientCount: recipientUserIds.length,
  };
}
