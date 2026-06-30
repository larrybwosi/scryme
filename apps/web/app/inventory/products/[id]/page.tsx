import React from "react";
import {
  getProduct,
  getCategories,
  getSuppliers,
  getInventoryLocations,
  getSystemUnits,
  getOrganizationUnits,
} from "../../../actions/inventory";
import { ProductPageClient } from "./product-page-client";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    product,
    categories,
    suppliers,
    locations,
    systemUnits,
    organizationUnits,
  ] = await Promise.all([
    getProduct(id),
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
