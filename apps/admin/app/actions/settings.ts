"use server";

import { db } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export async function listGlobalSettings() {
  await requireSuperAdmin();

  return db.globalSetting.findMany({
    orderBy: { key: "asc" },
  });
}

export async function setGlobalSetting(key: string, value: string) {
  await requireSuperAdmin();

  const setting = await db.globalSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  revalidatePath("/settings");
  return setting;
}

export async function deleteGlobalSetting(key: string) {
  await requireSuperAdmin();

  const existing = await db.globalSetting.findUnique({ where: { key } });
  if (!existing) {
    throw new Error(`Global setting with key "${key}" not found`);
  }

  await db.globalSetting.delete({ where: { key } });
  revalidatePath("/settings");
  return { success: true };
}
