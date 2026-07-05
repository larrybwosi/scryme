"use client";
import { addToCart } from "@/app/lib/cart-actions";
import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";

export function AddToCartButton({ variantId }: { variantId: string }) {
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    setLoading(true);
    try { await addToCart(variantId, 1); } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  return (
    <Button onClick={handleAdd} disabled={loading}>
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
