"use server";

import { db } from "@repo/db";
import {
  crmActivitySchema,
  type CrmActivityFormValues,
} from "../../lib/validations";
import { revalidatePath } from "next/cache";
import { getCurrentMember } from "./auth";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export async function createActivity(data: CrmActivityFormValues) {
  const validatedData = crmActivitySchema.parse(data);

  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  let activeMemberId = auth.memberId;
  if (!activeMemberId) {
    const currentMember = await getCurrentMember();
    activeMemberId = currentMember?.id || undefined;
  }

  const activity = await db.crmActivity.create({
    data: {
      ...validatedData,
      organizationId,
      memberId: activeMemberId,
    },
    include: {
      record: {
        include: {
          customer: true,
          businessAccount: true,
          objectDefinition: true,
        },
      },
    },
  });

  if (activity.record.customer) {
    revalidatePath(`/customers/${activity.record.customer.id}`);
  }
  if (activity.record.businessAccount) {
    revalidatePath(`/companies/${activity.record.businessAccount.id}`);
  }
  if (activity.record.objectDefinition.name === "deal") {
    revalidatePath(`/pipeline/${activity.recordId}`);
  }
  if (activity.record.objectDefinition.name === "lead") {
    revalidatePath(`/leads/${activity.recordId}`);
  }

  return activity;
}
