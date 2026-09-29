"use server";
import { getSession } from "./session";
import { getPortalSDK } from "./portal-sdk";
import { revalidatePath } from "next/cache";

export async function reorderTransaction(orgSlug: string, transactionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  const res = await sdk.orders.getB2BOrders();
  const orders = (res.data as any) || [];
  const tx = orders.find((o: any) => o.id === transactionId);

  if (!tx) throw new Error("Not found");

  for (const item of (tx as any).items) {
    await sdk.orders.addToCart({
      variantId: item.variantId,
      quantity: item.quantity,
      customerId: session.customerId
    });
  }

  revalidatePath(`/${orgSlug}/cart`);
}
