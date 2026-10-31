import { Metadata } from "next";
import { getDriverActiveDeliveries } from "@/app/actions/deliveries";
import { DriverPortalClient } from "./driver-portal-client";

export const metadata: Metadata = {
  title: "Driver Delivery Handover Portal",
  description: "Mobile-friendly active route, OTP verification, and proof of delivery handover for drivers.",
};

export default async function DriverPortalPage() {
  const deliveries = await getDriverActiveDeliveries();

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Driver Handover Portal</h1>
        <p className="text-sm text-muted-foreground">
          Active dispatches, customer verification OTPs, and proof of delivery handovers.
        </p>
      </div>
      <DriverPortalClient deliveries={deliveries as any} />
    </div>
  );
}
