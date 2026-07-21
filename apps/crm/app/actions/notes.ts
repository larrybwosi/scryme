"use server";

import { db, type CrmNote } from "@repo/db";
import { crmNoteSchema, type CrmNoteFormValues } from "../../lib/validations";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "./auth";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export async function createNote(data: CrmNoteFormValues): Promise<CrmNote> {
  const validatedData = crmNoteSchema.parse(data);
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  const currentMember = await getCurrentMember();
  const creatorId = currentMember?.id || null;

  const note = await db.crmNote.create({
    data: {
      ...validatedData,
      organizationId: organizationId,
      createdById: creatorId,
    },
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
        },
      },
    },
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
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function updateNote(id: string, content: string): Promise<CrmNote> {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");

  const note = await db.crmNote.update({
    where: { id },
    data: {
      content,
    },
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
        },
      },
    },
  });

  if (note.record.customer) {
    revalidatePath(`/customers/${note.record.customer.id}`);
  }
  if (note.record.businessAccount) {
    revalidatePath(`/companies/${note.record.businessAccount.id}`);
  }
  return note;
}

export async function deleteNote(id: string) {
  const note = await db.crmNote.delete({
    where: { id },
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
        },
      },
    },
  });

  if (note.record.customer) {
    revalidatePath(`/customers/${note.record.customer.id}`);
  }
  if (note.record.businessAccount) {
    revalidatePath(`/companies/${note.record.businessAccount.id}`);
  }
}
