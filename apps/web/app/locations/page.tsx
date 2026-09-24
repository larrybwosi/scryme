import { Metadata } from "next";
import React from "react";
import { getLocations, getMembersForSelect } from "../actions/locations";
import { LocationTable } from "../../components/locations/location-table";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { LocationSheet } from "../../components/locations/location-sheet";

export const metadata: Metadata = {
  title: "Branches & Locations",
  description: "Manage physical retail stores, warehouse locations, and branch parameters.",
};


export default async function LocationsPage() {
  // ⚡ Bolt Optimization: Parallelize independent database queries using Promise.all
  // Collapses 2 sequential network roundtrips into 1 concurrent roundtrip (~50% latency reduction)
  const [locations, members] = await Promise.all([
    getLocations(),
    getMembersForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Manage your branches, warehouses, and storage points.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LocationSheet locations={locations} members={members}>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Add Location</span>
            </Button>
          </LocationSheet>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-primary mb-2">
            <MapPin size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Total Locations
            </span>
          </div>
          <div className="text-2xl font-bold">{locations.length}</div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <MapPin size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Active Branches
            </span>
          </div>
          <div className="text-2xl font-bold">
            {locations.filter(l => l.locationType === "RETAIL_SHOP").length}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <MapPin size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Warehouses
            </span>
          </div>
          <div className="text-2xl font-bold">
            {locations.filter(l => l.locationType === "WAREHOUSE").length}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <LocationTable data={locations} members={members} />
      </div>
    </div>
  );
}
