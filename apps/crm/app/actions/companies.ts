'use server';

import { db } from '@repo/db';
import { businessAccountSchema, type BusinessAccountFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createCompany(data: BusinessAccountFormValues, organizationId: string) {
  const validatedData = businessAccountSchema.parse(data);

  const company = await db.businessAccount.create({
    data: {
      ...validatedData,
      organizationId,
    },
  });

  revalidatePath('/companies');
  return company;
}

export async function updateCompany(id: string, data: BusinessAccountFormValues) {
  const validatedData = businessAccountSchema.parse(data);

  const company = await db.businessAccount.update({
    where: { id },
    data: validatedData,
  });

  revalidatePath('/companies');
  return company;
}

export async function deleteCompany(id: string) {
  await db.businessAccount.delete({
    where: { id },
  });

  revalidatePath('/companies');
}

export async function getCompanies(organizationId: string) {
  return await db.businessAccount.findMany({
    where: { organizationId },
    include: {
        _count: {
            select: { customers: true }
        }
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCompany(id: string) {
    return await db.businessAccount.findUnique({
      where: { id },
      include: {
        customers: true,
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
      }
    });
  }
