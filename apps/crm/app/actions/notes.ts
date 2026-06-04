'use server';

import { db } from '@repo/db';
import { crmNoteSchema, type CrmNoteFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createNote(data: CrmNoteFormValues, organizationId: string, memberId?: string | null) {
  const validatedData = crmNoteSchema.parse(data);

  const note = await db.crmNote.create({
    data: {
      ...validatedData,
      organizationId,
      createdById: memberId,
    },
  });

  revalidatePath(`/customers/${note.recordId}`);
  revalidatePath(`/companies/${note.recordId}`);
  return note;
}

export async function getNotes(recordId: string) {
  return await db.crmNote.findMany({
    where: { recordId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function deleteNote(id: string) {
  const note = await db.crmNote.delete({
    where: { id },
  });

  revalidatePath(`/customers/${note.recordId}`);
  revalidatePath(`/companies/${note.recordId}`);
}
