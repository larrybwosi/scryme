import 'server-only';
import { db as prisma } from '@repo/db';
import { Prisma } from '@repo/db';

export type InvoiceQuerySortField = 'grandTotal' | 'dueDate' | 'postingDate' | 'customerName';
export type SortOrder = 'asc' | 'desc';

export interface PendingInvoiceQueryOptions {
  organizationId: string;
  status?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: InvoiceQuerySortField;
  sortOrder?: SortOrder;
  search?: string;
}

export const InvoiceQueryService = {
  /**
   * Get customers with pending invoices.
   * This queries the Invoice model and groups/joins with customer information.
   */
  async getCustomersWithPendingInvoices(options: PendingInvoiceQueryOptions) {
    const {
      organizationId,
      status = ['PENDING', 'DRAFT', 'PARTIALLY_PAID', 'SUBMITTED'],
      page = 1,
      pageSize = 15,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      search,
    } = options;

    const skip = (page - 1) * pageSize;

    // Build the where clause for Invoices
    const where: any = {
      organizationId,
      status: { in: status },
    };

    if (search) {
      where.OR = [
        { customer: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Define ordering
    let orderBy: any;
    if (sortBy === 'customerName') {
      orderBy = { customer: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Execute query
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Batch resolve customer/business accounts to avoid N+1
    const customerIds = [...new Set(invoices.map((inv: any) => inv.customer))];

    const [customers, businessAccounts, dispatches] = await Promise.all([
      prisma.customer.findMany({
        where: {
          organizationId,
          OR: [
            { id: { in: customerIds as string[] } },
            { email: { in: customerIds as string[] } }
          ]
        }
      }),
      prisma.businessAccount.findMany({
        where: {
          organizationId,
          id: { in: customerIds as string[] }
        }
      }),
      prisma.notificationDispatch.findMany({
        where: {
          organizationId,
          template: { name: 'CUSTOMER_INVOICE_REMINDER' },
          data: { path: ['invoiceId'], in: invoices.map((i: any) => i.id) } as any
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const customerMap = new Map(customers.map((c: any) => [c.id, c]));
    const customerEmailMap = new Map(customers.filter((c: any) => c.email).map((c: any) => [c.email!, c]));
    const businessMap = new Map(businessAccounts.map((b: any) => [b.id, b]));

    // Map last reminder for each invoice
    const lastReminderMap = new Map();
    dispatches.forEach((d: any) => {
      const invId = (d.data as any)?.invoiceId;
      if (invId && !lastReminderMap.has(invId)) {
        lastReminderMap.set(invId, d.createdAt);
      }
    });

    const enrichedInvoices = invoices.map((invoice: any) => {
      let customerData = { name: invoice.customer, email: null as string | null };

      const matchedCustomer = customerMap.get(invoice.customer) || customerEmailMap.get(invoice.customer);
      const matchedBusiness = businessMap.get(invoice.customer);

      if (matchedCustomer) {
        customerData = { name: (matchedCustomer as any).name, email: (matchedCustomer as any).email };
      } else if (matchedBusiness) {
        customerData = { name: (matchedBusiness as any).name, email: null };
      }

      return {
        ...invoice,
        customerDetails: customerData,
        lastReminderAt: lastReminderMap.get(invoice.id) || null,
      };
    });

    return {
      invoices: enrichedInvoices,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  },
};
