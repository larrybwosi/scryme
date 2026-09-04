import React from "react";
import { Metadata } from "next";
import { getService, getServiceCategories } from "../../../actions/services";
import { getOrganizationSettings } from "../../../actions/organization";
import { ServiceDetailPageClient } from "./service-detail-client";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getService(id);

  if (!service) {
    return {
      title: "Service Not Found",
      description: "The requested service could not be found.",
    };
  }

  return {
    title: `${service.name} — Service Details`,
    description: service.description || `Manage service configuration, pricing, staff assignments, and durations for ${service.name}.`,
  };
}

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
