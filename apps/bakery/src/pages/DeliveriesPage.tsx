// fallow-ignore-next-line unused-files
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { PartnerManager } from "@/components/bakery/PartnerManager";
import { DeliveryTracker } from "@/components/bakery/DeliveryTracker";

export default function DeliveriesPage() {
  const [activeTab, setActiveTab] = useState("tracking");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter">
          DELIVERY OPERATIONS
        </h1>
        <p className="text-muted-foreground font-medium">
          Manage third-party partners and track active shipments.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 border border-border/50">
          <TabsTrigger
            value="tracking"
            className="data-[state=active]:bg-background"
          >
            Active Tracking
          </TabsTrigger>
          <TabsTrigger
            value="partners"
            className="data-[state=active]:bg-background"
          >
            Delivery Partners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="mt-6">
          <DeliveryTracker />
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <PartnerManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
