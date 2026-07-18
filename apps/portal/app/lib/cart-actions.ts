"use server";
import { getSession } from "./session";
import { getPortalSDK } from "./portal-sdk";
import { revalidatePath } from "next/cache";

export async function getCart(orgSlug: string) {
  const sdk = await getPortalSDK();
  return await sdk.cart.getCart(orgSlug);
}

export async function addToCart(orgSlug: string, variantId: string, quantity: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  await sdk.cart.addItem(orgSlug, {
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
  await sdk.cart.removeItem(orgSlug, {
    variantId,
    customerId: session.customerId
  });
  revalidatePath(`/${orgSlug}/cart`);
}

export async function checkout(orgSlug: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const sdk = await getPortalSDK();
  const cart = await sdk.cart.getCart(orgSlug);
  if (!cart || !cart.items || cart.items.length === 0) throw new Error("Cart is empty");

  const orderData = {
    items: cart.items.map((item: any) => ({
      variantId: item.variantId,
      quantity: item.quantity
    }))
  };

  const tx = await sdk.b2b.createOrder(orgSlug, orderData);

  revalidatePath(`/${orgSlug}/orders`);
  revalidatePath(`/${orgSlug}/cart`);

  return tx;
}
