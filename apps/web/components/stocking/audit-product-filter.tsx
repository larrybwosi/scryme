"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ProductVariantSelect } from "../product-variant-select";

interface ProductVariant {
  variantId: string;
  name: string;
  sku?: string;
}

export function AuditProductFilter({
  products,
}: {
  products: ProductVariant[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const variantId = searchParams.get("variantId") || "";

  const variants = products.map(p => ({
    id: p.variantId,
    name: "Default",
    productName: p.name,
    sku: p.sku,
  }));

  return (
    <ProductVariantSelect
      variants={variants}
      value={variantId}
      onValueChange={val => {
        const params = new URLSearchParams(searchParams);
        if (val) {
          params.set("variantId", val);
        } else {
          params.delete("variantId");
        }
        router.push(`${pathname}?${params.toString()}`);
      }}
      placeholder="All Products"
    />
  );
}
