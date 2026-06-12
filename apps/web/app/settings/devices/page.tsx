import { Smartphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDevices } from "@/app/actions/devices";
import { DeviceList } from "@/components/settings/device-list";

export default async function DevicesPage() {
  const devices = await getDevices();

  return (
    <div className="w-full space-y-6 p-6 lg:p-10">
      <PageHeader
        title="Authorized Devices"
        subtitle="Manage POS and Bakery devices authorized to access your organization"
        icon={<Smartphone className="w-7 h-7" />}
      />

      <DeviceList devices={devices} />
    </div>
  );
}
