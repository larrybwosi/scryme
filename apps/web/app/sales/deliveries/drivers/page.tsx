import { Metadata } from "next";
import React from "react";
import { getDrivers } from "../../../actions/drivers";
import { DriverTable } from "../../../../components/drivers/driver-table";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Users, Search, Filter, Download } from "lucide-react";
import { AddDriverSheet } from "../../../../components/drivers/add-driver-sheet";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";

export const metadata: Metadata = {
  title: "Drivers & Fleet Roster",
  description: "Manage delivery personnel, driver availability, vehicles, and active delivery assignments.",
};

export default async function DriversTabPages() {
  const result = await getDrivers();
  const drivers = (result.success ? result.data : []) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Drivers & Fleet Roster</h2>
          <p className="text-sm text-muted-foreground">
            Monitor active drivers, vehicle assignments, and availability statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddDriverSheet>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Add New Driver</span>
            </Button>
          </AddDriverSheet>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background p-4 rounded-xl border border-border/60 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold">{drivers.length}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              Registered
            </Badge>
          </div>
        </div>

        <div className="bg-background p-4 rounded-xl border border-border/60 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Active (Online)</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold">
              {drivers.filter((d: any) => d.availability === "ONLINE").length}
            </h3>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              Ready
            </Badge>
          </div>
        </div>

        <div className="bg-background p-4 rounded-xl border border-border/60 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">On Delivery</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {drivers.filter((d: any) => d.availability === "ON_DELIVERY").length}
            </h3>
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              In Transit
            </Badge>
          </div>
        </div>
      </div>

      {/* Driver Table */}
      <DriverTable data={drivers as any} />
    </div>
  );
}
