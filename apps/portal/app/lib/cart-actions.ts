"use server";
import { db } from "@repo/db";
import { getSession } from "./session.server";
export async function getCart(orgId: string, customerId: string) {
  let cart = await db.cart.findFirst({ where: { organizationId: orgId, customerId, status: "ACTIVE" }, include: { items: { include: { variant: { include: { product: true, priceListItems: true } } } } } });
  if (!cart) cart = await db.cart.create({ data: { organizationId: orgId, customerId, status: "ACTIVE" }, include: { items: { include: { variant: { include: { product: true, priceListItems: true } } } } } });
  return cart;
}
export async function addToCart(variantId: string, quantity: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("Variant not found");

  const cart = await getCart(session.orgId, session.customerId);
  const existing = cart.items.find(i => i.variantId === variantId);
  if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  else await db.cartItem.create({ data: { cartId: cart.id, productId: variant.productId, variantId, quantity } });
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) return await db.cartItem.delete({ where: { id: itemId } });
  await db.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

export async function removeFromCart(itemId: string) {
  await db.cartItem.delete({ where: { id: itemId } });
}

export async function checkout() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const cart = await getCart(session.orgId, session.customerId) as any;
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  const org = await db.organization.findUnique({
    where: { id: session.orgId },
    include: { inventoryLocations: { where: { isActive: true }, take: 1 } }
  });

  if (!org || org.inventoryLocations.length === 0) throw new Error("Organization has no active locations");
  const locationId = org.inventoryLocations[0].id;

  const subtotal = cart.items.reduce((acc: number, item: any) => {
    const price = Number(item.variant?.priceListItems[0]?.price || 0);
    return acc + (price * item.quantity);
  }, 0);

  const tx = await db.transaction.create({
    data: {
      number: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      type: "SALES_ORDER",
      channel: "ECOMMERCE_STORE",
      status: "PENDING_CONFIRMATION",
      organizationId: session.orgId,
      customerId: session.customerId,
      locationId: locationId,
      subtotal: subtotal,
      finalTotal: subtotal,
      baseCurrencyTotal: subtotal,
      items: {
        create: cart.items.map((item: any) => ({
          variantId: item.variantId,
          productName: item.variant.product.name,
          variantName: item.variant.name,
          sku: item.variant.sku,
          quantity: item.quantity,
          listPrice: item.variant.priceListItems[0]?.price || 0,
          unitPrice: item.variant.priceListItems[0]?.price || 0,
          unitCost: item.variant.buyingPrice || 0,
          subtotal: Number(item.variant.priceListItems[0]?.price || 0) * item.quantity,
          lineTotal: Number(item.variant.priceListItems[0]?.price || 0) * item.quantity,
        }))
      }
    }
  });

  await db.cart.update({
    where: { id: cart.id },
    data: { status: "COMPLETED" as any }
  });

  return tx;
}
