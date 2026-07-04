import { requireSession } from "@/app/lib/session";
import { getCart } from "@/app/lib/cart-actions";
import { Button } from "@repo/ui";
export default async function CartPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = await params;
  const session = await requireSession(orgSlug);
  const cart = await getCart(session.orgId, session.customerId);
  return (<div>{cart.items.map(i => (<div key={i.id}>{i.variant.product.name}</div>))}<Button>Checkout</Button></div>);
}