import { requireSession } from "@/app/lib/session";
import { getB2BProducts } from "@/app/lib/actions";
import { AddToCartButton } from "./add-to-cart-button";
import { Card, CardHeader, CardTitle, CardFooter } from "@repo/ui";
export default async function CatalogPage({ params }: { params: { orgSlug: string } }) {
  const { orgSlug } = await params;
  const session = await requireSession(orgSlug);
  const products = await getB2BProducts(session.orgId);
  return (<div>{products.map(p => (<Card key={p.id}><CardHeader><CardTitle>{p.name}</CardTitle></CardHeader><CardFooter><AddToCartButton variantId={p.variants[0]?.id} /></CardFooter></Card>))}</div>);
}