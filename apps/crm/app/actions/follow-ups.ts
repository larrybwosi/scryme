"use server";

import { addDays, addWeeks, addMonths } from "date-fns";
import { db, type CrmFollowUp } from "@repo/db";
import {
  crmFollowUpSchema,
  type CrmFollowUpFormValues,
} from "../../lib/validations";
import { revalidatePath } from "next/cache";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export async function createFollowUp(
  data: CrmFollowUpFormValues,
): Promise<CrmFollowUp> {
  const validatedData = crmFollowUpSchema.parse(data);

  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  // Automatically tie to customer's default location if not provided
  let locationId = validatedData.locationId;
  if (!locationId) {
    const record = await db.crmRecord.findUnique({
      where: { id: validatedData.recordId },
      include: { customer: true },
    });
    if (record?.customer?.defaultLocationId) {
      locationId = record.customer.defaultLocationId;
    }
  }

  const followUp = await db.crmFollowUp.create({
    data: {
      ...validatedData,
      locationId,
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

  // Handle recurring follow-ups
  if (
    data.status === "COMPLETED" &&
    followUp.isRecurring &&
    followUp.recurringInterval
  ) {
    let nextDueDate = new Date(followUp.dueDate);

    switch (followUp.recurringInterval) {
      case "DAILY":
        nextDueDate = addDays(nextDueDate, 1);
        break;
      case "WEEKLY":
        nextDueDate = addWeeks(nextDueDate, 1);
        break;
      case "MONTHLY":
        nextDueDate = addMonths(nextDueDate, 1);
        break;
    }

    await db.crmFollowUp.create({
      data: {
        title: followUp.title,
        description: followUp.description,
        dueDate: nextDueDate,
        priority: followUp.priority,
        status: "PENDING",
        type: followUp.type,
        recordId: followUp.recordId,
        organizationId: followUp.organizationId,
        assignedToId: followUp.assignedToId,
        locationId: followUp.locationId,
        isRecurring: true,
        recurringInterval: followUp.recurringInterval,
      },
    });
  }

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
