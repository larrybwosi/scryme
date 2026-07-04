"use client";
import { addToCart } from "@/app/lib/cart-actions";
import { useState } from "react";
import { Button } from "@repo/ui";
export function AddToCartButton({ variantId }: { variantId: string }) {
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    setLoading(true);
    try { await addToCart(variantId, 1); } catch (e) {} finally { setLoading(false); }
  };
  return <Button onClick={handleAdd} loading={loading}>Add to Cart</Button>;
}