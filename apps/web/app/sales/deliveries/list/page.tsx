import { Metadata } from "next";
import { FilterBar } from "../../../../components/filter-bar";
import { getFulfillments } from "../../../actions/sales";
import { DeliveryTable } from "../../../../components/sales/delivery-table";
import { FulfillmentStatus } from "@repo/db/client";

export const metadata: Metadata = {
  title: "Deliveries & Dispatches List",
  description: "Track fulfillment status, driver dispatches, and batch traceability.",
};

export default async function DeliveriesListPage(props: {
  searchParams: Promise<{
    status?: string;
    driverId?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const fulfillments = await getFulfillments({
    status: searchParams.status as FulfillmentStatus | "all",
    driverId: searchParams.driverId,
    startDate: searchParams.start ? new Date(searchParams.start) : undefined,
    endDate: searchParams.end ? new Date(searchParams.end) : undefined,
  });

  return (
    <div className="space-y-6">
      <FilterBar />
      <DeliveryTable fulfillments={fulfillments as any} />
    </div>
  );
}
