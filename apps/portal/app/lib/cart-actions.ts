"use server";
import { getSession } from "./session";
import { getPortalSDK } from "./portal-sdk";
import { revalidatePath } from "next/cache";

export async function getCart(orgSlug: string) {
  const session = await getSession();
  const sdk = await getPortalSDK();
  const res = await sdk.orders.getCart({
    sessionId: session?.customerId || "portal-session",
  });
  return res.data;
}

export async function addToCart(orgSlug: string, variantId: string, quantity: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  await sdk.orders.addToCart({
    variantId,
    quantity,
    customerId: session.customerId
  });
  revalidatePath(`/${orgSlug}/cart`);
}

export async function updateCartItemQuantity(orgSlug: string, itemId: string, quantity: number) {
}

export async function removeFromCart(orgSlug: string, variantId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  await sdk.orders.removeFromCart({
    variantId,
    customerId: session.customerId
  });
  revalidatePath(`/${orgSlug}/cart`);
}

export async function checkout(orgSlug: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  const cartRes = await sdk.orders.getCart({
    sessionId: session.customerId,
  });
  const cart: any = cartRes.data;
  const items = cart?.items || cart?.data?.items || [];
  if (!items || items.length === 0) throw new Error("Cart is empty");

  const orderData = {
    customerId: session.customerId,
    locationId: "default",
    channel: "B2B_PORTAL" as any,
    items: items.map((item: any) => ({
      variantId: item.variantId,
      quantity: item.quantity
    }))
  };

  const res = await sdk.orders.createOrder(orderData);

  revalidatePath(`/${orgSlug}/orders`);
  revalidatePath(`/${orgSlug}/cart`);

  return res.data;
}
