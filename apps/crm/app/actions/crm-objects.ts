'use server';

import { db } from '@repo/db';
import { crmObjectDefinitionSchema, type CrmObjectDefinitionFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createObjectDefinition(data: CrmObjectDefinitionFormValues, organizationId: string) {
  const validatedData = crmObjectDefinitionSchema.parse(data);

  const definition = await db.crmObjectDefinition.create({
    data: {
      ...validatedData,
      organizationId,
    },
  });

  revalidatePath('/settings/crm');
  return definition;
}

export async function getObjectDefinitions(organizationId: string): Promise<any[]> {
  return await db.crmObjectDefinition.findMany({
    where: { organizationId },
    include: {
      fields: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getObjectDefinition(id: string): Promise<any> {
  return await db.crmObjectDefinition.findUnique({
    where: { id },
    include: {
      fields: true,
    },
  });
}
