"use server";
import { db } from "@repo/db";
import { getSession } from "./session.server";
import { revalidatePath } from "next/cache";

export async function updateAccount(orgSlug: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;

  await db.customer.update({
    where: { id: session.customerId },
    data: {
      name,
      email,
      phone,
      company,
    }
  });

  revalidatePath(`/${orgSlug}/account`);
}
