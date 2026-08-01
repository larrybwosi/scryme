import React from "react";
import { getService, getServiceCategories } from "../../../actions/services";
import { getOrganizationSettings } from "../../../actions/organization";
import { ServiceDetailPageClient } from "./service-detail-client";
import { notFound } from "next/navigation";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [service, categories, organization] = await Promise.all([
    getService(id),
    getServiceCategories(),
    getOrganizationSettings(),
  ]);

  if (!service) {
    notFound();
  }

  const currency = organization?.settings?.defaultCurrency || "USD";

  const serializedService = {
    ...service,
    price: Number(service.price),
    minPrice: service.minPrice ? Number(service.minPrice) : null,
    depositAmount: service.depositAmount ? Number(service.depositAmount) : null,
  };

  return (
    <ServiceDetailPageClient
      initialService={serializedService}
      categories={categories}
      currency={currency}
    />
  );
}
