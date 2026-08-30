import React from "react";
import { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  return {
    title: `${product.name} — Product Details`,
    description: product.description || `Manage inventory, stock levels, variants, and pricing for ${product.name}.`,
  };
}

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
