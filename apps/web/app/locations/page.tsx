import React from "react";
import { getLocations, getMembersForSelect } from "../actions/locations";
import { LocationTable } from "../../components/locations/location-table";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { LocationDialog } from "../../components/locations/location-dialog";

export default async function LocationsPage() {
  const locations = await getLocations();
  const members = await getMembersForSelect();

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Locations</h1>
          <p className="text-sm text-muted-foreground">Manage your branches, warehouses, and storage points.</p>
        </div>
        <div className="flex items-center gap-3">
          <LocationDialog locations={locations} members={members}>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Add Location</span>
            </Button>
          </LocationDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <MapPin size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Total Locations</span>
          </div>
          <div className="text-2xl font-bold">{locations.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <MapPin size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Active Branches</span>
          </div>
          <div className="text-2xl font-bold">
            {locations.filter(l => l.locationType === 'RETAIL_SHOP').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-orange-600 mb-2">
            <MapPin size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Warehouses</span>
          </div>
          <div className="text-2xl font-bold">
            {locations.filter(l => l.locationType === 'WAREHOUSE').length}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <LocationTable data={locations} members={members} />
      </div>
    </div>
  );
}
