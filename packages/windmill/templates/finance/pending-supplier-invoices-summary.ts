import { db as prisma } from "@repo/db";
import { NotificationEngine } from "@repo/notifications";

const notificationEngine = new NotificationEngine();

/**
 * Windmill Script: Pending Supplier Invoices Summary
 *
 * This script sends a summary of pending (unpaid/partially paid) supplier invoices
 * to admins and managers who have opted in.
 */
export async function main(data: {
  organizationId: string;
  orgName: string;
  count: number;
  totalAmount: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    supplierName: string;
    amount: number;
    dueDate: string;
  }>;
}) {
  const { organizationId, orgName, count, totalAmount, invoices } = data;

  // 1. Find all Admins/Managers for this organization
  const members = await prisma.member.findMany({
    where: {
      organizationId,
      role: { in: ["ADMIN", "MANAGER"] },
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  // 2. Filter by those who have opted in for supplierInvoiceReminders
  const optedInMembers = members.filter((member) => {
    const prefs = member.user.notificationPrefs as any;
    // Default to true if not set, or check explicit preference
    return prefs?.supplierInvoiceReminders !== false;
  });

  if (optedInMembers.length === 0) {
    console.log(`No opted-in admins/managers found for Org ${organizationId}`);
    return { success: true, message: "No recipients opted in" };
  }

  const recipientUserIds = optedInMembers.map((m) => m.userId);

  // 3. Send notification via NotificationEngine
  await notificationEngine.notify({
    organizationId,
    templateName: "PENDING_SUPPLIER_INVOICES_SUMMARY",
    data: {
      orgName,
      count,
      totalAmount,
      invoices,
    },
    recipients: {
      userIds: recipientUserIds,
    },
    channels: ["WEBHOOK", "DISCORD"],
  });

  return {
    success: true,
    recipientCount: recipientUserIds.length,
  };
}
