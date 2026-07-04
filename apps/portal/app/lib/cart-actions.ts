import { db } from "@repo/db";
import { getSession } from "./session";
export async function getCart(orgId: string, customerId: string) {
  let cart = await db.cart.findFirst({ where: { organizationId: orgId, customerId, status: "ACTIVE" }, include: { items: { include: { variant: { include: { product: true, prices: true } } } } } });
  if (!cart) cart = await db.cart.create({ data: { organizationId: orgId, customerId, status: "ACTIVE" }, include: { items: { include: { variant: { include: { product: true, prices: true } } } } } });
  return cart;
}
export async function addToCart(variantId: string, quantity: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const cart = await getCart(session.orgId, session.customerId);
  const existing = cart.items.find(i => i.variantId === variantId);
  if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  else await db.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
}