'use server';

import { db } from '@repo/db';
import { customerSchema, type CustomerFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: CustomerFormValues, organizationId: string) {
  const validatedData = customerSchema.parse(data);

  const customer = await db.customer.create({
    data: {
      ...validatedData,
      organizationId,
    },
  });

  revalidatePath('/customers');
  return customer;
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
  const validatedData = customerSchema.parse(data);

  const customer = await db.customer.update({
    where: { id },
    data: validatedData,
  });

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
  return customer;
}

export async function deleteCustomer(id: string) {
  await db.customer.delete({
    where: { id },
  });

  revalidatePath('/customers');
}

export async function getCustomers(organizationId: string) {
  return await db.customer.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCustomer(id: string) {
  return await db.customer.findUnique({
    where: { id },
    include: {
      businessAccount: true,
    }
  });
}
