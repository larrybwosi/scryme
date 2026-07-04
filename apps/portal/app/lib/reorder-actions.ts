import { db } from "@repo/db";
import { getSession } from "./session";
import { getCart } from "./cart-actions";
export async function reorderTransaction(orgSlug: string, transactionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const tx = await db.transaction.findUnique({ where: { id: transactionId }, include: { items: true } });
  if (!tx || tx.customerId !== session.customerId) throw new Error("Not found");
  const cart = await getCart(session.orgId, session.customerId);
  for (const item of tx.items) {
    await db.cartItem.create({ data: { cartId: cart.id, variantId: item.variantId!, quantity: item.quantity } });
  }
}