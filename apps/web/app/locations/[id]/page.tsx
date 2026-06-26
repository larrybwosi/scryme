import React from "react";
import {
  getLocation,
  getLocations,
  getLocationStock,
  getMembersForSelect,
} from "../../actions/locations";
import { notFound } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  MapPin,
  ArrowLeft,
  Settings,
  Layers,
  Box,
  ChevronRight,
  Database,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { LocationSheet } from "../../../components/locations/location-sheet";
import { ZoneList } from "../../../components/locations/zone-list";
import { UnitList } from "../../../components/locations/unit-list";
import { LocationManagementTab } from "../../../components/locations/location-management-tab";
import { LocationStockTable } from "../../../components/locations/location-stock-table";
import { db } from "@repo/db";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    tab?: string;
  }>;
}

export default async function LocationDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { search, page, sortBy, sortOrder, tab } = await searchParams;

  const location = await getLocation(id);
  const allLocations = await getLocations();
  const members = await getMembersForSelect();

  // Fetch paginated variants with their stock for this location
  const { data: formattedStock, total: stockTotal } = await getLocationStock({
    locationId: id,
    search,
    page: page ? parseInt(page) : 1,
    pageSize: 50,
    sortBy,
    sortOrder,
  });

  if (!location) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/locations"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1D1D1F] transition-colors w-fit">
          <ArrowLeft size={14} />
          Back to Locations
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center shadow-sm text-blue-600">
              <MapPin size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#1D1D1F]">
                  {location.name}
                </h1>
                <Badge variant="secondary" className="capitalize">
                  {location.locationType.toLowerCase().replace("_", " ")}
                </Badge>
                {location.isDefault && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200">
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {location.code
                  ? `Code: ${location.code}`
                  : "No location code assigned"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LocationSheet
              location={location}
              locations={allLocations}
              members={members}
              isEdit>
              <Button variant="outline" className="gap-2">
                <Settings size={16} />
                <span>Configure</span>
              </Button>
            </LocationSheet>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Manager</span>
                <span className="font-medium">
                  {location.manager?.user?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Parent Location</span>
                <span className="font-medium">
                  {location.parentLocation?.name || "Root"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Description</span>
                <p className="text-[#1D1D1F]">
                  {location.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-muted-foreground block">Address</span>
                <div className="p-3 rounded-lg bg-gray-50 border text-xs space-y-1">
                  {location.address ? (
                    <>
                      <p>{(location.address as any).street}</p>
                      <p>
                        {(location.address as any).city},{" "}
                        {(location.address as any).state}{" "}
                        {(location.address as any).zipCode}
                      </p>
                      <p>{(location.address as any).country}</p>
                    </>
                  ) : (
                    <p className="italic text-muted-foreground">
                      No address added
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-xs text-blue-600 font-semibold uppercase mb-1">
                  Sub-locations
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {location.childLocations.length}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="text-xs text-orange-600 font-semibold uppercase mb-1">
                  Zones
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {location.zones.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Hierarchy & Storage */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={tab || "hierarchy"} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <Link href={`/locations/${id}?tab=hierarchy`} passHref>
                <TabsTrigger value="hierarchy" className="gap-2 w-full">
                  <Layers size={16} />
                  Hierarchy
                </TabsTrigger>
              </Link>
              <Link href={`/locations/${id}?tab=stock`} passHref>
                <TabsTrigger value="stock" className="gap-2 w-full">
                  <Database size={16} />
                  Stock
                </TabsTrigger>
              </Link>
              <Link href={`/locations/${id}?tab=storage`} passHref>
                <TabsTrigger value="storage" className="gap-2 w-full">
                  <Box size={16} />
                  Storage
                </TabsTrigger>
              </Link>
              <Link href={`/locations/${id}?tab=management`} passHref>
                <TabsTrigger value="management" className="gap-2 w-full">
                  <Settings size={16} />
                  Enterprise
                </TabsTrigger>
              </Link>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-6">
              {/* Sub-locations Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />
                    Sub-locations
                  </h3>
                  <LocationSheet
                    locations={allLocations}
                    members={members}
                    location={{ parentLocationId: location.id }}>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus size={14} />
                      Add Sub-location
                    </Button>
                  </LocationSheet>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {location.childLocations.length === 0 ? (
                    <div className="col-span-2 p-8 border rounded-xl bg-white text-center text-muted-foreground flex flex-col items-center gap-2">
                      <Layers size={24} className="opacity-20" />
                      <p>No sub-locations configured for this site.</p>
                    </div>
                  ) : (
                    location.childLocations.map((child: any) => (
                      <Link key={child.id} href={`/locations/${child.id}`}>
                        <div className="p-4 rounded-xl border bg-white hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 border flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                              <MapPin size={18} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {child.name}
                              </div>
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                {child.locationType}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-gray-300 group-hover:text-blue-500"
                          />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Zones Section */}
              <ZoneList locationId={location.id} zones={location.zones} />
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database size={18} className="text-blue-600" />
                    Inventory Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationStockTable
                    locationId={location.id}
                    initialData={formattedStock}
                    totalCount={stockTotal}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage" className="space-y-4">
              <UnitList
                locationId={location.id}
                zones={location.zones}
                units={location.storageUnits}
              />
            </TabsContent>

            <TabsContent value="management" className="space-y-4">
              <LocationManagementTab location={location} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
