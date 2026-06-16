"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function updateReceiptConfig(data: {
  showLogo?: boolean;
  logoUrl?: string;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const config = await db.receiptConfig.upsert({
    where: { organizationId: auth.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: auth.organizationId,
    },
  });

  revalidatePath("/settings/documents");
  return config;
}

export async function updateWaybillConfig(data: {
  showLogo?: boolean;
  logoUrl?: string;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) throw new Error("Unauthorized");

  const config = await db.waybillConfig.upsert({
    where: { organizationId: auth.organizationId },
    update: data,
    create: {
      ...data,
      organizationId: auth.organizationId,
    },
  });

  revalidatePath("/settings/documents");
  return config;
}
