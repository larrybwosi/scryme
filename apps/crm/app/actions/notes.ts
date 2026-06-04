'use server';

import { db, type CrmNote } from '@repo/db';
import { crmNoteSchema, type CrmNoteFormValues } from '../../lib/validations';
import { revalidatePath } from 'next/cache';

export async function createNote(data: CrmNoteFormValues, organizationId: string, memberId?: string | null): Promise<CrmNote> {
  const validatedData = crmNoteSchema.parse(data);

  const note = await db.crmNote.create({
    data: {
      ...validatedData,
      organizationId,
      createdById: memberId,
    },
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
        }
      }
    }
  });

  if (note.record.customer) {
    revalidatePath(`/customers/${note.record.customer.id}`);
  }
  if (note.record.businessAccount) {
    revalidatePath(`/companies/${note.record.businessAccount.id}`);
  }
  return note;
}

export async function getNotes(recordId: string): Promise<any[]> {
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
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
        }
      }
    }
  });

  if (note.record.customer) {
    revalidatePath(`/customers/${note.record.customer.id}`);
  }
  if (note.record.businessAccount) {
    revalidatePath(`/companies/${note.record.businessAccount.id}`);
  }
}
