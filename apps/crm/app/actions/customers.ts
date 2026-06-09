'use server';

import { db } from '@repo/db';
import { customerSchema, type CustomerFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: CustomerFormValues, organizationId: string): Promise<any> {
  try {
    const validatedData = customerSchema.parse(data);

    const customer = await db.customer.create({
      data: {
        ...validatedData,
        organizationId,
      },
    });

    revalidatePath('/customers');
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { success: false, error: error.message || 'Failed to create customer' };
  }
}

export async function updateCustomer(id: string, data: CustomerFormValues): Promise<any> {
  try {
    const validatedData = customerSchema.parse(data);

    const customer = await db.customer.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { success: false, error: error.message || 'Failed to update customer' };
  }
}

export async function deleteCustomer(id: string): Promise<any> {
  try {
    await db.customer.delete({
      where: { id },
    });

    revalidatePath('/customers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return { success: false, error: error.message || 'Failed to delete customer' };
  }
}

export async function getCustomers(organizationId: string): Promise<any[]> {
  try {
    const customers = await db.customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
}

export async function getCustomer(id: string): Promise<any> {
  try {
    // ⚡ Bolt: Optimize detail fetching by using targeted select and aggregations.
    // This reduces DB payload size and serialization overhead compared to deep includes.
    const [customer, totals, paidTotals] = await Promise.all([
      db.customer.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          customerType: true,
          dateOfBirth: true,
          loyaltyPoints: true,
          taxId: true,
          isActive: true,
          tags: true,
          organizationId: true,
          businessAccountId: true,
          crmRecordId: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          updatedById: true,
          creationType: true,
          pinnedLocation: true,
          deliveryNotes: true,
          defaultLocationId: true,
          businessAccount: {
            select: {
              id: true,
              name: true,
              taxId: true,
              organizationId: true,
              defaultLocationId: true,
              crmRecordId: true,
            },
          },
          addresses: {
            select: {
              id: true,
              customerId: true,
              businessAccountId: true,
              type: true,
              label: true,
              street1: true,
              street2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              latitude: true,
              longitude: true,
              isDefault: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          invoices: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              customerId: true,
              customerName: true,
              postingDate: true,
              dueDate: true,
              netTotal: true,
              totalTaxes: true,
              grandTotal: true,
              amountPaid: true,
              balanceDue: true,
              status: true,
              kraPin: true,
              kraCompliant: true,
              etrMode: true,
              organizationId: true,
              transactionId: true,
              templateId: true,
              templateVersion: true,
              createdAt: true,
              updatedAt: true,
              items: {
                select: {
                  id: true,
                  invoiceId: true,
                  itemCode: true,
                  itemName: true,
                  quantity: true,
                  rate: true,
                  amount: true,
                  taxTemplate: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          transactions: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              number: true,
              type: true,
              subtotal: true,
              discountTotal: true,
              taxTotal: true,
              finalTotal: true,
              status: true,
              paymentStatus: true,
              channel: true,
              organizationId: true,
              locationId: true,
              customerId: true,
              memberId: true,
              createdAt: true,
              updatedAt: true,
              items: {
                select: {
                  id: true,
                  transactionId: true,
                  variantId: true,
                  productName: true,
                  variantName: true,
                  sku: true,
                  quantity: true,
                  listPrice: true,
                  unitPrice: true,
                  unitCost: true,
                  subtotal: true,
                  discountAmount: true,
                  taxAmount: true,
                  lineTotal: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              fulfillments: {
                select: {
                  id: true,
                  status: true,
                  transactionId: true,
                  driverId: true,
                  shippingAddressId: true,
                  createdAt: true,
                  updatedAt: true,
                  items: {
                    select: {
                      id: true,
                      fulfillmentId: true,
                      transactionItemId: true,
                      quantity: true,
                      createdAt: true,
                      updatedAt: true,
                      transactionItem: { select: { productName: true } },
                    },
                  },
                },
              },
            },
          },
          crmRecord: {
            select: {
              id: true,
              objectId: true,
              organizationId: true,
              data: true,
              ownerId: true,
              createdAt: true,
              updatedAt: true,
              activities: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  recordId: true,
                  organizationId: true,
                  type: true,
                  description: true,
                  metadata: true,
                  memberId: true,
                  createdAt: true,
                  member: {
                    select: {
                      id: true,
                      organizationId: true,
                      userId: true,
                      user: { select: { id: true, name: true, image: true, email: true } },
                    },
                  },
                },
              },
              notes: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  recordId: true,
                  organizationId: true,
                  content: true,
                  createdById: true,
                  timelineDate: true,
                  createdAt: true,
                  updatedAt: true,
                  createdBy: {
                    select: {
                      id: true,
                      organizationId: true,
                      userId: true,
                      user: { select: { id: true, name: true, image: true, email: true } },
                    },
                  },
                },
              },
              followUps: {
                take: 20,
                orderBy: { dueDate: 'asc' },
                select: {
                  id: true,
                  recordId: true,
                  organizationId: true,
                  title: true,
                  description: true,
                  dueDate: true,
                  priority: true,
                  status: true,
                  assignedToId: true,
                  completedAt: true,
                  createdAt: true,
                  updatedAt: true,
                  assignedTo: {
                    select: {
                      id: true,
                      organizationId: true,
                      userId: true,
                      user: { select: { id: true, name: true, image: true, email: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.invoice.aggregate({
        where: { customerId: id },
        _sum: { grandTotal: true },
      }),
      db.invoice.aggregate({
        where: { customerId: id, status: 'PAID' },
        _sum: { grandTotal: true },
      }),
    ]);

    if (!customer) return null;

    // Inject aggregations into the response object
    const totalInvoiced = totals._sum.grandTotal || 0;
    const totalPaidInvoices = paidTotals._sum.grandTotal || 0;
    const balance = totalInvoiced - totalPaidInvoices;

    return {
      ...customer,
      totalInvoiced,
      totalPaidInvoices,
      balance,
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
}
