import React from 'react';
import {
  getProduct,
  getCategories,
  getSuppliers,
  getInventoryLocations,
  getSystemUnits,
  getOrganizationUnits
} from "../../../actions/inventory";
import { ProductPageClient } from "./product-page-client";
import { notFound } from "next/navigation";

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const [product, categories, suppliers, locations, systemUnits, organizationUnits] = await Promise.all([
    getProduct(params.id),
    getCategories(),
    getSuppliers(),
    getInventoryLocations(),
    getSystemUnits(),
    getOrganizationUnits(),
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
      systemUnits={systemUnits}
      organizationUnits={organizationUnits}
    />
  );
}
