'use server';

import { db } from '@repo/db';
import { customerSchema, type CustomerFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: CustomerFormValues, organizationId: string) {
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

export async function updateCustomer(id: string, data: CustomerFormValues) {
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

export async function deleteCustomer(id: string) {
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

export async function getCustomers(organizationId: string) {
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

export async function getCustomer(id: string) {
<<<<<<< HEAD
  try {
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        businessAccount: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        crmRecord: {
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            notes: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });
    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
=======
  return await db.customer.findUnique({
    where: { id },
    include: {
      businessAccount: true,
    }
  });
>>>>>>> 7048f951ddcc4cdb080e411a2372192476e7affa
}
