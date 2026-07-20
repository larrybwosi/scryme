"use server";

import { getServerAuth } from "@repo/auth/server";
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

export async function approveCampaign(id: string) {
  const auth = await getServerAuth();
  if (!auth) throw new Error("Unauthorized");
  const memberId = auth.memberId;
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
