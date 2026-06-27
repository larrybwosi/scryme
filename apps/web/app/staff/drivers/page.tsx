import React from "react";
import { getDrivers } from "../../actions/drivers";
import { DriverTable } from "../../../components/drivers/driver-table";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Truck, Search, Filter, Download } from "lucide-react";
import { AddDriverSheet } from "../../../components/drivers/add-driver-sheet";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";

export default async function DriversPage() {
  const result = await getDrivers();
  const drivers = (result.success ? result.data : []) || [];

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">
              Driver Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage your organization&apos;s drivers, vehicles and delivery
              partners.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-gray-200">
            <Download size={16} />
            <span>Export</span>
          </Button>
          <AddDriverSheet>
            <Button className="gap-2 bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white">
              <Plus size={16} />
              <span>Add Driver</span>
            </Button>
          </AddDriverSheet>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Drivers</p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold">{drivers.length}</h3>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-600 border-blue-100">
                Registered
              </Badge>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500">Active (Online)</p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold">
                {drivers.filter(d => d.availability === "ONLINE").length}
              </h3>
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-600 border-green-100">
                Ready
              </Badge>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500">On Delivery</p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-blue-600">
                {drivers.filter(d => d.availability === "ON_DELIVERY").length}
              </h3>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-600 border-blue-100">
                In Transit
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              placeholder="Search drivers by name or phone..."
              className="pl-10 bg-white border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-gray-200">
              <Filter size={14} />
              <span>Filters</span>
            </Button>
          </div>
        </div>

        <DriverTable data={drivers as any} />
      </div>
    </div>
  );
}
