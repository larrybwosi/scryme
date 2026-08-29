import { Metadata } from "next";
import React from "react";
import { getProduct, getCategories } from "../../../actions/inventory";
import { getService, getServiceCategories } from "../../../actions/services";
import { getOrganizationSettings } from "../../../actions/organization";
import { notFound } from "next/navigation";
import { HybridCmsClient } from "./cms-client";

export default async function HybridCmsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const rawType = resolvedSearchParams.type || "product";

  // Prevent heavy DB reads: only fetch either product or service depending on type
  let item: any = null;
  let categories: any[] = [];
  const organization = await getOrganizationSettings();
  const currency = organization?.settings?.defaultCurrency || "USD";

  if (rawType === "service") {
    const serviceData = await getService(id);
    if (!serviceData) {
      notFound();
    }
    item = {
      ...serviceData,
      price: Number(serviceData.price),
      minPrice: serviceData.minPrice ? Number(serviceData.minPrice) : null,
      depositAmount: serviceData.depositAmount ? Number(serviceData.depositAmount) : null,
    };
    categories = await getServiceCategories();
  } else {
    // Default to product
    const productData = await getProduct(id);
    if (!productData) {
      notFound();
    }
    item = productData;
    categories = await getCategories();
  }

  return (
    <HybridCmsClient
      initialItem={item}
      categories={categories}
      currency={currency}
      itemType={rawType === "service" ? "service" : "product"}
    />
  );
}

export const metadata: Metadata = {
  title: "CMS Content Details",
  description: "Edit CMS content, promotional text, and media entries.",
};
