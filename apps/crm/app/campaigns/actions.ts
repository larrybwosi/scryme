"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";

export async function submitCampaignForApproval(id: string) {
  await db.campaign.update({
    where: { id },
    data: { status: "PENDING_APPROVAL" },
  });
  revalidatePath("/campaigns/" + id);
  revalidatePath("/campaigns");
}

export async function approveCampaign(id: string, memberId: string) {
  await db.campaign.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: memberId,
      approvedAt: new Date(),
    },
  });
  revalidatePath("/campaigns/" + id);
  revalidatePath("/campaigns");
}

export async function rejectCampaign(id: string) {
  await db.campaign.update({
    where: { id },
    data: { status: "DRAFT" },
  });
  revalidatePath("/campaigns/" + id);
  revalidatePath("/campaigns");
}
