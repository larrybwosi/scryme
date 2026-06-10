import "server-only";
import { prisma } from "@repo/db";
import { NotificationEngine } from "@repo/notifications";
import { runAutomation } from "@repo/windmill/server";

const notificationEngine = new NotificationEngine();

// Configuration for when to send reminders (days overdue)
const REMINDER_SCHEDULE = [0, 3, 7, 14, 30];

export const InvoiceAutomationService = {
  /**
   * Orchestrates the daily check for customer invoice reminders.
   */
  async runCustomerInvoiceReminders() {
    console.log(
      "[InvoiceAutomation] Starting customer invoice reminder automation...",
    );

    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    for (const org of organizations) {
      await this.processOrgInvoiceReminders(org.id, org.name);
    }

    console.log(
      "[InvoiceAutomation] Customer invoice reminder automation completed.",
    );
  },

  /**
   * Process reminders for a specific organization.
   */
  async processOrgInvoiceReminders(organizationId: string, orgName: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Find pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ["PENDING", "SUBMITTED", "PARTIALLY_PAID"] },
        dueDate: { not: null },
      },
    });

    if (pendingInvoices.length === 0) return;

    const overdueInvoices = pendingInvoices.filter((inv: any) => {
      if (!inv.dueDate) return false;
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });

    if (overdueInvoices.length > 0) {
      // Notify Admins with a summary via Windmill
      try {
        await runAutomation({
          organizationId,
          scriptPath: "f/dealio/finance/overdue-invoices-summary",
          dealioEventType: "overdue_invoices_summary",
          data: {
            orgName,
            count: overdueInvoices.length,
            totalAmount: overdueInvoices.reduce(
              (sum: number, inv: any) => sum + inv.grandTotal,
              0,
            ),
            invoices: overdueInvoices.map((inv: any) => ({
              id: inv.id,
              customer: inv.customer,
              amount: inv.grandTotal,
              dueDate: inv.dueDate?.toLocaleDateString(),
            })),
            eventType: "overdue_invoices_summary",
          },
        });
      } catch (error) {
        console.error(
          `[InvoiceAutomation] Failed to trigger Windmill for Org ${organizationId}:`,
          error,
        );
      }
    }

    // 2. Individual Customer Reminders based on schedule
    for (const invoice of pendingInvoices) {
      if (!invoice.dueDate) continue;

      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Only send if it matches our schedule
      if (REMINDER_SCHEDULE.includes(diffDays)) {
        await this.sendCustomerReminder(organizationId, orgName, invoice);
      }
    }
  },

  async sendCustomerReminder(
    organizationId: string,
    orgName: string,
    invoice: any,
  ) {
    try {
      // Resolve customer/business account
      const [customer, businessAccount] = await Promise.all([
        prisma.customer.findFirst({
          where: {
            organizationId,
            OR: [
              { id: invoice.customer as string },
              { email: invoice.customer as string },
            ],
          },
        }),
        prisma.businessAccount.findFirst({
          where: {
            organizationId,
            id: invoice.customer as string,
          },
        }),
      ]);

      const email =
        customer?.email ||
        (invoice.customer.includes("@") ? invoice.customer : null);
      const name = customer?.name || businessAccount?.name || "Valued Customer";

      if (email) {
        // Find or create a shadow user for the customer if they don't have one
        // so that NotificationEngine can resolve the recipient.
        // If the email belongs to an existing user, use that ID.
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Note: In a real system, we might not want to create shadow users.
          // For now, we'll try to use the user ID if it exists.
          console.log(
            `[InvoiceAutomation] No User found for email ${email}, skipping automated email via NotificationEngine.`,
          );
          return;
        }

        await notificationEngine.notify({
          organizationId,
          templateName: "CUSTOMER_INVOICE_REMINDER",
          data: {
            customerName: name,
            invoiceId: invoice.id,
            amount: invoice.grandTotal,
            dueDate: invoice.dueDate?.toLocaleDateString(),
            orgName,
          },
          recipients: {
            userIds: [user.id],
          },
          channels: ["EMAIL"],
        });

        console.log(
          `[InvoiceAutomation] Sent reminder for Invoice ${invoice.id} to ${email}`,
        );
      }
    } catch (error) {
      console.error(
        `[InvoiceAutomation] Failed to notify customer for Invoice ${invoice.id}:`,
        error,
      );
    }
  },
};
