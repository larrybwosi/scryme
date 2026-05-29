/**
 * Customer Service — internal database
 *
 * All customer storage is primarily managed by the local DB.
 * The native CRM module provides dynamic fields and activities.
 */

import { db as prisma, type Customer, type CrmRecord, type Invoice, type Transaction } from "@repo/db";
import { runAutomation } from '@repo/windmill/server';
import type { ActionResponse } from "../../types/action-response";
import { LoyaltyService } from './loyalty.service';

export const CustomerService = {
  /**
   * List customers from local DB.
   */
  async getCustomers(
    organizationId: string,
    searchParams?: {
      query?: string;
      page?: number;
      pageSize?: number;
      orderBy?: string;
    }
  ): Promise<ActionResponse<{ customers: any[]; totalCount: number; totalPages: number }>> {
    try {
      const { query = '', page = 1, pageSize = 15 } = searchParams ?? {};
      const skip = (page - 1) * pageSize;

      const where = {
        organizationId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' as const } },
                { email: { contains: query, mode: 'insensitive' as const } },
                { phone: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [customers, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where,
          take: pageSize,
          skip,
          orderBy: { name: 'asc' },
          include: {
            crmRecord: true,
          },
        }),
        prisma.customer.count({ where }),
      ]);

      return {
        success: true,
        data: {
          customers: customers.map((c: Customer & { crmRecord?: CrmRecord | null }) => ({
            ...c,
            localId: c.id,
            // UI compatibility shape
            name: { firstName: c.name, lastName: '' },
            emails: { primaryEmail: c.email },
            phones: { primaryPhoneNumber: c.phone },
          })),
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    } catch (error) {
      console.error('[CustomerService] getCustomers error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch customers.',
      };
    }
  },

  /**
   * Fetch a single customer by their local ID with financial data.
   */
  async getCustomerById(organizationId: string, customerId: string): Promise<ActionResponse<any>> {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, organizationId },
        include: {
          crmRecord: {
            include: {
              notes: { orderBy: { timelineDate: 'desc' } },
              activities: { orderBy: { createdAt: 'desc' } },
            },
          },
          invoices: {
            orderBy: { postingDate: 'desc' },
          },
          transactions: {
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!customer) {
        return { success: false, message: 'Customer not found.' };
      }

      // Calculate balance
      const totalInvoiced = (customer.invoices as Invoice[]).reduce((acc: number, inv: Invoice) => acc + inv.grandTotal, 0);
      const totalPaidInvoices = (customer.invoices as Invoice[])
        .filter((inv: Invoice) => inv.status === 'PAID')
        .reduce((acc: number, inv: Invoice) => acc + inv.grandTotal, 0);

      const balance = totalInvoiced - totalPaidInvoices;

      return {
        success: true,
        data: {
          ...customer,
          localId: customer.id,
          name: { firstName: customer.name, lastName: '' },
          emails: { primaryEmail: customer.email },
          phones: { primaryPhoneNumber: customer.phone },
          balance,
          stats: [
            { label: 'Total Invoiced', value: totalInvoiced, color: 'blue' },
            { label: 'Total Paid', value: totalPaidInvoices, color: 'green' },
            { label: 'Current Balance', value: balance, color: balance > 0 ? 'orange' : 'green' },
          ]
        },
      };
    } catch (error) {
      console.error('[CustomerService] getCustomerById error:', error);
      return { success: false, message: 'Failed to fetch customer.' };
    }
  },

  /**
   * Create or update a customer.
   */
  async saveCustomer(
    organizationId: string,
    _memberId: string,
    formData: {
      id?: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      company?: string | null;
      notes?: string | null;
      avatar?: string | null;
      city?: string | null;
      jobTitle?: string | null;
    }
  ): Promise<ActionResponse<{ customer: any; localId: string }>> {
    try {
      const { id, name, email, phone, company } = formData;

      const customerData = {
        name,
        email: email ?? null,
        phone: phone ?? null,
        company: company ?? null,
        organizationId,
      };

      let customer;
      if (id) {
        customer = await prisma.customer.update({
          where: { id },
          data: customerData,
        });
      } else {
        customer = await prisma.customer.create({
          data: customerData,
        });

        // Trigger CRM Sync (New Master)
        try {
          const personObject = await prisma.crmObjectDefinition.findFirst({
            where: { organizationId, name: 'person' }
          });

          if (personObject) {
            const crmRecord = await prisma.crmRecord.create({
              data: {
                objectId: personObject.id,
                organizationId,
                data: {
                  firstName: customer.name,
                  email: customer.email,
                  phone: customer.phone,
                }
              }
            });
            await prisma.customer.update({
              where: { id: customer.id },
              data: { crmRecordId: crmRecord.id }
            });
          }
        } catch (crmError) {
          console.error('[CustomerService] CRM Record creation failed:', crmError);
        }

        // Process referral signup rewards
        await LoyaltyService.processReferral(prisma as any, organizationId, customer.id, customer.id, 'SIGNUP');

        // Trigger Windmill notification for new customer registration
        try {
          await runAutomation({
            organizationId,
            scriptPath: 'f/dealio/customer-registration-alert',
            dealioEventType: 'customer_registration',
            data: {
              customerId: customer.id,
              customerName: name,
              customerEmail: email,
              eventType: 'customer_registration',
            },
          });
        } catch (error) {
          console.error('[CustomerService] Failed to trigger registration notification:', error);
        }
      }

      return {
        success: true,
        message: id ? 'Customer updated successfully.' : 'Customer created successfully.',
        data: {
          customer: {
            ...customer,
            name: { firstName: customer.name, lastName: '' },
            emails: { primaryEmail: customer.email },
            phones: { primaryPhoneNumber: customer.phone },
          },
          localId: customer.id,
        },
      };
    } catch (error) {
      console.error('[CustomerService] saveCustomer error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save customer.';
      return { success: false, message: msg };
    }
  },

  /**
   * Delete a customer.
   */
  async deleteCustomer(
    organizationId: string,
    _userId: string,
    customerId: string
  ): Promise<ActionResponse<{ id: string }>> {
    try {
      await prisma.customer.delete({
        where: { id: customerId, organizationId },
      });

      return { success: true, message: 'Customer deleted successfully.', data: { id: customerId } };
    } catch (error) {
      console.error('[CustomerService] deleteCustomer error:', error);
      return { success: false, message: 'Failed to delete customer.' };
    }
  },
};
