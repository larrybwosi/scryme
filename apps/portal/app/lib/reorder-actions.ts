"use server";
import { getSession } from "./session";
import { getPortalSDK } from "./portal-sdk";
import { revalidatePath } from "next/cache";

export async function reorderTransaction(orgSlug: string, transactionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  const orders = await sdk.b2b.getOrders(orgSlug);
  const tx = orders.find((o: any) => o.id === transactionId);

  if (!tx) throw new Error("Not found");

  for (const item of tx.items) {
    await sdk.cart.addItem(orgSlug, {
      variantId: item.variantId,
      quantity: item.quantity,
      customerId: session.customerId
    });
  }

  revalidatePath(`/${orgSlug}/cart`);
}
