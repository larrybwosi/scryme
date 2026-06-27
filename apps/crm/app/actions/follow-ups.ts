"use server";

import { db, type CrmFollowUp } from "@repo/db";
import {
  crmFollowUpSchema,
  type CrmFollowUpFormValues,
} from "../../lib/validations";
import { revalidatePath } from "next/cache";

export async function createFollowUp(
  data: CrmFollowUpFormValues,
  organizationId: string,
): Promise<CrmFollowUp> {
  const validatedData = crmFollowUpSchema.parse(data);

  const followUp = await db.crmFollowUp.create({
    data: {
      ...validatedData,
      organizationId,
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

  if (followUp.record.customer) {
    revalidatePath(`/customers/${followUp.record.customer.id}`);
  }
  if (followUp.record.businessAccount) {
    revalidatePath(`/companies/${followUp.record.businessAccount.id}`);
  }
  return followUp;
}

export async function updateFollowUp(
  id: string,
  data: Partial<CrmFollowUpFormValues>,
): Promise<CrmFollowUp> {
  const followUp = await db.crmFollowUp.update({
    where: { id },
    data: {
      ...data,
      completedAt: data.status === "COMPLETED" ? new Date() : undefined,
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

  if (followUp.record.customer) {
    revalidatePath(`/customers/${followUp.record.customer.id}`);
  }
  if (followUp.record.businessAccount) {
    revalidatePath(`/companies/${followUp.record.businessAccount.id}`);
  }
  return followUp;
}

export async function getFollowUps(recordId: string): Promise<any[]> {
  return await db.crmFollowUp.findMany({
    where: { recordId },
    orderBy: { dueDate: "asc" },
    include: {
      assignedTo: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function deleteFollowUp(id: string) {
  const followUp = await db.crmFollowUp.delete({
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

  if (followUp.record.customer) {
    revalidatePath(`/customers/${followUp.record.customer.id}`);
  }
  if (followUp.record.businessAccount) {
    revalidatePath(`/companies/${followUp.record.businessAccount.id}`);
  }
}
