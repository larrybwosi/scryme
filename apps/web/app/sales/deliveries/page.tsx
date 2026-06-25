import { Truck } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { FilterBar } from "../../../components/filter-bar";
import { getFulfillments } from "../../actions/sales";
import { DeliveryTable } from "../../../components/sales/delivery-table";
import { FulfillmentStatus } from "@repo/db/client";

export default async function DeliveriesPage(props: {
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
      <PageHeader
        title="Deliveries"
        subtitle="Track and manage shipping and local deliveries"
        icon={<Truck className="w-7 h-7" />}
      />

      <FilterBar />

      <DeliveryTable fulfillments={fulfillments} />
    </div>
  );
}
