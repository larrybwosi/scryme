"use client";
import { removeFromCart } from "@/app/lib/cart-actions";
import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Trash2 } from "lucide-react";

export function RemoveFromCartButton({ orgSlug, variantId }: { orgSlug: string; variantId: string }) {
  const [loading, setLoading] = useState(false);
  const handleRemove = async () => {
    setLoading(true);
    try { await removeFromCart(orgSlug, variantId); } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  return (
    <Button variant="ghost" size="icon" className="text-destructive" onClick={handleRemove} disabled={loading}>
      <Trash2 className="size-4" />
    </Button>
  );
}
