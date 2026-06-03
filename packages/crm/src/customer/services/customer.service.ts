import 'server-only';
import { PrismaClient } from '@repo/db/client';
import { runAutomation } from '@repo/windmill/server';
import { ActionResponse } from '../types';
import { RecordService } from '../../services/record.service';
import { SchemaService } from '../../services/schema.service';
import { LoyaltyService } from './loyalty/loyalty.service';

export class CustomerService {
  private recordService: RecordService;
  private schemaService: SchemaService;

  constructor(private prisma: PrismaClient) {
    this.recordService = new RecordService(prisma);
    this.schemaService = new SchemaService(prisma);
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) {
      return { firstName: name, lastName: '' };
    }
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ');
    return { firstName, lastName };
  }

  /**
   * List customers from local DB, merged with CRM data.
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
        ...(query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query, mode: 'insensitive' as const } },
          ]
        } : {})
      };

      const [customers, totalCount] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          take: pageSize,
          skip,
          orderBy: { name: 'asc' },
          include: {
            crmRecord: true
          }
        }),
        this.prisma.customer.count({ where }),
      ]);

      return {
        success: true,
        data: {
          customers: customers.map(c => {
            const crmData = (c.crmRecord?.data as Record<string, any>) || {};
            const { firstName, lastName } = this.splitName(c.name);
            return {
              ...c,
              ...crmData,
              localId: c.id,
              // UI compatibility shape
              name: {
                firstName: crmData.firstName || firstName,
                lastName: crmData.lastName || lastName
              },
              emails: { primaryEmail: c.email },
              phones: { primaryPhoneNumber: c.phone },
            };
          }),
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
  }

  /**
   * Fetch a single customer by their local ID, merged with CRM data and financial stats.
   */
  async getCustomerById(organizationId: string, customerId: string): Promise<ActionResponse<any>> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, organizationId },
        include: {
          crmRecord: {
            include: {
              notes: { orderBy: { timelineDate: 'desc' } },
              activities: { orderBy: { createdAt: 'desc' } }
            }
          },
          invoices: {
            orderBy: { postingDate: 'desc' },
          },
          transactions: {
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        }
      });

      if (!customer) {
        return { success: false, message: 'Customer not found.' };
      }

      const crmData = (customer.crmRecord?.data as Record<string, any>) || {};
      const { firstName, lastName } = this.splitName(customer.name);

      // Calculate balance
      const totalInvoiced = customer.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
      const totalPaidInvoices = customer.invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((acc, inv) => acc + inv.grandTotal, 0);

      const balance = totalInvoiced - totalPaidInvoices;

      return {
        success: true,
        data: {
          customer: {
            ...customer,
            ...crmData,
            localId: customer.id,
            name: {
              firstName: crmData.firstName || firstName,
              lastName: crmData.lastName || lastName
            },
            emails: { primaryEmail: customer.email },
            phones: { primaryPhoneNumber: customer.phone },
          },
          balance,
          stats: [
            { label: 'Total Invoiced', value: `$${totalInvoiced.toLocaleString()}`, color: 'blue' },
            { label: 'Total Paid', value: `$${totalPaidInvoices.toLocaleString()}`, color: 'green' },
            { label: 'Current Balance', value: `$${balance.toLocaleString()}`, color: balance > 0 ? 'orange' : 'green' },
          ],
          invoices: customer.invoices,
          transactions: customer.transactions,
          activities: customer.crmRecord?.activities || [],
          notes: customer.crmRecord?.notes || [],
        }
      };
    } catch (error) {
      console.error('[CustomerService] getCustomerById error:', error);
      return { success: false, message: 'Failed to fetch customer.' };
    }
  }

  /**
   * Create or update a customer, ensuring CRM record synchronization.
   */
  async saveCustomer(
    organizationId: string,
    memberId: string,
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
      [key: string]: any;
    }
  ): Promise<ActionResponse<{ customer: any; localId: string }>> {
    try {
      const { id, name, email, phone, company, ...extraFields } = formData;
      const { firstName, lastName } = this.splitName(name);

      const customerData = {
        name,
        email: email ?? null,
        phone: phone ?? null,
        company: company ?? null,
        organizationId,
      };

      // 1. Ensure CRM Object Definition exists for "person"
      let personObject = await this.schemaService.getObjectByName(organizationId, 'person');
      if (!personObject) {
        const seeded = await this.schemaService.seedStandardObjects(organizationId);
        personObject = seeded.person;
      }

      // 2. Prepare CRM record data
      const crmRecordData = {
        firstName,
        lastName,
        email,
        phone,
        company,
        ...extraFields,
      };

      let customer = null;
      if (id) {
        customer = await this.prisma.customer.findUnique({
          where: { id },
          include: { crmRecord: true }
        });
      } else if (email || phone) {
        // Safe lookup: only if email or phone is provided
        customer = await this.prisma.customer.findFirst({
          where: {
            organizationId,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
          include: { crmRecord: true }
        });
      }

      if (customer) {
        // Update existing customer
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: customerData,
          include: { crmRecord: true }
        });

        if (customer.crmRecordId) {
          await this.recordService.updateRecord(customer.crmRecordId, crmRecordData, organizationId, memberId);
        } else {
          const record = await this.recordService.createRecord({
            objectId: personObject.id,
            organizationId,
            data: crmRecordData,
            ownerId: memberId,
          });
          customer = await this.prisma.customer.update({
            where: { id: customer.id },
            data: { crmRecordId: record.id },
            include: { crmRecord: true }
          });
        }
      } else {
        // Create new customer
        const record = await this.recordService.createRecord({
          objectId: personObject.id,
          organizationId,
          data: crmRecordData,
          ownerId: memberId,
        });

        customer = await this.prisma.customer.create({
          data: {
            ...customerData,
            crmRecordId: record.id,
          },
          include: { crmRecord: true }
        });

        // Trigger Loyalty processing and Windmill notification for new customer
        try {
          // Initialize loyalty account if needed (External)
          await LoyaltyService.adjustPointsExternal(customer.id, 0, 'MANUAL_ADJUSTMENT', 'Initial registration');

          // Internal loyalty referral
          await LoyaltyService.processReferral(this.prisma, organizationId, customer.id, customer.id, 'SIGNUP');

          // Trigger CRM Sync (New Master) - Merged from shared
          try {
            const personObject = await this.prisma.crmObjectDefinition.findFirst({
              where: { organizationId, name: 'person' }
            });

            if (personObject) {
              const crmRecord = await this.prisma.crmRecord.create({
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
              await this.prisma.customer.update({
                where: { id: customer.id },
                data: { crmRecordId: crmRecord.id }
              });
            }
          } catch (crmError) {
            console.error('[CustomerService] CRM Record creation failed:', crmError);
          }

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
          console.error('[CustomerService] Failed to trigger registration actions:', error);
        }
      }

      return {
        success: true,
        message: id ? 'Customer updated successfully.' : 'Customer created successfully.',
        data: {
          customer: {
            ...customer,
            name: { firstName, lastName },
            emails: { primaryEmail: customer.email },
            phones: { primaryPhoneNumber: customer.phone },
          },
          localId: customer.id
        }
      };
    } catch (error) {
      console.error('[CustomerService] saveCustomer error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save customer.';
      return { success: false, message: msg };
    }
  }

  /**
   * Delete a customer and its associated CRM record.
   */
  async deleteCustomer(
    organizationId: string,
    _userId: string,
    customerId: string
  ): Promise<ActionResponse<{ id: string }>> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId, organizationId }
      });

      if (!customer) throw new Error('Customer not found');

      if (customer.crmRecordId) {
        await this.recordService.deleteRecord(customer.crmRecordId, organizationId);
      }

      await this.prisma.customer.delete({
        where: { id: customerId },
      });

      return { success: true, message: 'Customer deleted successfully.', data: { id: customerId } };
    } catch (error) {
      console.error('[CustomerService] deleteCustomer error:', error);
      return { success: false, message: 'Failed to delete customer.' };
    }
  }
}
