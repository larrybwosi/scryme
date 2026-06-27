import React from "react";
import { getDriverDetail } from "../../../actions/drivers";
import { notFound } from "next/navigation";
import { DriverDetailHeader } from "../../../../components/drivers/detail/driver-detail-header";
import { DriverDeliveries } from "../../../../components/drivers/detail/driver-deliveries";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Truck,
  Activity,
  Settings,
  LayoutDashboard,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

export default async function DriverDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const result = await getDriverDetail(id);

  if (!result.success || !result.data) {
    if (result.error === "Driver not found") {
      notFound();
    }
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-gray-500">{result.error}</p>
      </div>
    );
  }

  const driver = result.data;

  // Basic stats
  const totalDeliveries = driver.fulfillments.length;
  const completedDeliveries = driver.fulfillments.filter(
    (f: any) => f.status === "DELIVERED",
  ).length;

  return (
    <div className="flex flex-col gap-8 p-8 bg-gray-50/50 min-h-screen">
      <DriverDetailHeader driver={driver} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedDeliveries}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDeliveries > 0
                ? Math.round((completedDeliveries / totalDeliveries) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Member Linked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {driver.memberId ? "Yes" : "Independent"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deliveries" className="space-y-6">
        <TabsList className="bg-white border p-1 h-auto gap-1">
          <TabsTrigger
            value="deliveries"
            className="gap-2 px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-[#1D1D1F]">
            <Truck size={16} />
            Deliveries
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-2 px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-[#1D1D1F]">
            <History size={16} />
            Activity Log
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="gap-2 px-4 py-2 data-[state=active]:bg-gray-100 data-[state=active]:text-[#1D1D1F]">
            <Settings size={16} />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="space-y-6 outline-none">
          <DriverDeliveries fulfillments={driver.fulfillments} />
        </TabsContent>

        <TabsContent value="history" className="outline-none">
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Activity logging for drivers coming soon.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="outline-none">
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Driver settings and vehicle assignment coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
