import { requireSession } from "@/app/lib/session";
import { getCart } from "@/app/lib/cart-actions";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CheckoutButton } from "./checkout-button";
import { RemoveFromCartButton } from "./remove-from-cart-button";

export default async function CartPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireSession(orgSlug);
  const cart = await getCart(orgSlug) as any;

  const items = cart?.items || [];

  const total = items.reduce((acc: number, item: any) => {
    const price = Number(item.variant?.price || item.variant?.priceListItems?.[0]?.price || 0);
    return acc + (price * item.quantity);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <ShoppingBag className="size-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Button asChild>
          <Link href={`/${orgSlug}/catalog`}>Browse Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-muted-foreground">Review your items before placing an order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-primary-foreground">
        <div className="lg:col-span-2">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => {
                  const price = Number(item.variant?.price || item.variant?.priceListItems?.[0]?.price || 0);
                  const subtotal = price * item.quantity;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="size-12 relative bg-muted rounded overflow-hidden">
                          {item.variant?.product?.imageUrls?.[0] ? (
                            <Image
                              src={item.variant.product.imageUrls[0]}
                              alt={item.variant.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.variant?.product?.name}</div>
                        <div className="text-xs text-muted-foreground">{item.variant?.name}</div>
                      </TableCell>
                      <TableCell className="text-right">${price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">${subtotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <RemoveFromCartButton orgSlug={orgSlug} variantId={item.variantId} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <CheckoutButton orgSlug={orgSlug} />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
