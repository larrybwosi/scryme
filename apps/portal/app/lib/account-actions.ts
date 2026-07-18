"use server";
import { getSession } from "./session";
import { revalidatePath } from "next/cache";
import { getPortalSDK } from "./portal-sdk";

export async function updateAccount(orgSlug: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const company = formData.get("company") as string;

  const sdk = await getPortalSDK();
  await sdk.customers.updateCustomer(orgSlug, session.customerId, {
    name,
    email,
    phone,
    company,
  });

  revalidatePath(`/${orgSlug}/account`);
}
