import { Metadata } from "next";
import React from "react";
import { getServices, getServiceCategories } from "../../actions/services";
import { getOrganizationSettings } from "../../actions/organization";
import { ServicesPageClient } from "./services-client";

export const metadata: Metadata = {
  title: "Service Catalog",
  description: "Manage bookable services, durations, staff assignments, and service billing.",
};


export default async function ServicesPage() {
  const [services, categories, organization] = await Promise.all([
    getServices(),
    getServiceCategories(),
    getOrganizationSettings(),
  ]);

  const currency = organization?.settings?.defaultCurrency || "USD";

  // Format any raw Decimal objects from Prisma so they are safe to pass to the client
  const serializedServices = services.map((s: any) => ({
    ...s,
    price: Number(s.price),
    minPrice: s.minPrice ? Number(s.minPrice) : null,
    depositAmount: s.depositAmount ? Number(s.depositAmount) : null,
  }));

  return (
    <ServicesPageClient
      initialServices={serializedServices}
      initialCategories={categories}
      currency={currency}
    />
  );
}
