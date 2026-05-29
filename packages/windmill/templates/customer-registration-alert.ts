import { db as prisma } from '@repo/db';
import { NotificationEngine } from '@repo/notifications';

const notificationEngine = new NotificationEngine();

/**
 * Windmill Script: Customer Registration Alert
 *
 * This script notifies admins when a new customer registers.
 */
export async function main(data: {
  organizationId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
}) {
  const { organizationId, customerId, customerName, customerEmail } = data;

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

  // 2. Filter by those who have opted in for customerRegistration
  const optedInAdmins = admins.filter(admin => {
    const prefs = admin.user.notificationPrefs as any;
    // Default to true if not set
    return prefs?.customerRegistration !== false;
  });

  if (optedInAdmins.length === 0) {
    console.log(`No opted-in admins found for Org ${organizationId}`);
    return { success: true, message: 'No recipients opted in' };
  }

  const recipientUserIds = optedInAdmins.map(a => a.userId);

  // 3. Send notification
  await notificationEngine.notify({
    organizationId,
    templateName: 'NEW_CUSTOMER_REGISTRATION',
    data: {
      customerId,
      customerName,
      customerEmail,
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
