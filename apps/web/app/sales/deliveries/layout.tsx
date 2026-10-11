import React from "react";
import { Metadata } from "next";
import { Truck } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { DeliveriesTabs } from "../../../components/sales/deliveries-tabs";

export const metadata: Metadata = {
  title: "Deliveries & Dispatch Tracking",
  description: "Track fulfillments, batch dispatches, drivers, fleet, reconciliation, and delivery partners.",
};

export default function DeliveriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries & Dispatch Center"
        subtitle="End-to-end dispatch tracking, batch linkage, fleet management, and post-delivery reconciliation"
        icon={<Truck className="w-7 h-7" />}
      />
      <DeliveriesTabs />
      <div>{children}</div>
    </div>
  );
}
