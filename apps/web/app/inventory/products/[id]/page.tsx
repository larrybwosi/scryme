import React from 'react';
import { getProduct, getCategories, getSuppliers, getInventoryLocations } from "../../../actions/inventory";
import { ProductPageClient } from "./product-page-client";
import { notFound } from "next/navigation";

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const [product, categories, suppliers, locations] = await Promise.all([
    getProduct(params.id),
    getCategories(),
    getSuppliers(),
    getInventoryLocations(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductPageClient
      product={product}
      categories={categories}
      suppliers={suppliers}
      locations={locations}
    />
  );
}
