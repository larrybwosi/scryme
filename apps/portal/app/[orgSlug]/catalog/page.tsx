import { requireSession } from "@/app/lib/session";
import { getB2BProducts } from "@/app/lib/actions";
import { AddToCartButton } from "./add-to-cart-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  CardContent,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import { Search } from "lucide-react";
import Image from "next/image";

export default async function CatalogPage({
  params,
  searchParams
}: {
  params: Promise<{ orgSlug: string }>,
  searchParams: Promise<{ q?: string }>
}) {
  const { orgSlug } = await params;
  const { q } = await searchParams;
  await requireSession(orgSlug);
  const products = await getB2BProducts(orgSlug, q);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground">Browse and order items for your business.</p>
        </div>
        <form className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Search products..."
            className="pl-8"
            defaultValue={q}
          />
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-primary-foreground">
        {products.map((p: any) => {
          const variant = p.variants?.[0];
          const price = variant?.price || variant?.priceListItems?.[0]?.price;

          return (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className="aspect-square relative bg-muted">
                {p.imageUrls?.[0] ? (
                  <Image
                    src={p.imageUrls[0]}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-1">{p.name}</CardTitle>
                  {p.isNew && <Badge variant="secondary">New</Badge>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow">
                <div className="text-2xl font-bold">
                  {price ? `$${Number(price).toFixed(2)}` : "Price on request"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">SKU: {p.sku}</p>
              </CardContent>
              <CardFooter className="p-4 border-t bg-muted/50">
                <AddToCartButton orgSlug={orgSlug} variantId={variant?.id} />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No products found matching your search.</p>
        </div>
      )}
    </div>
  );
}
