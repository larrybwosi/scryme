"use client";
import { checkout } from "@/app/lib/cart-actions";
import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { useRouter } from "next/navigation";

export function CheckoutButton({ orgSlug }: { orgSlug: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const tx = await checkout(orgSlug);
      router.push(`/${orgSlug}/orders/${tx.id}`);
    } catch (e) {
      alert("Failed to checkout: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? "Processing..." : "Proceed to Checkout"}
    </Button>
  );
}
