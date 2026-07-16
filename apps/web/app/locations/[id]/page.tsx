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
  Copy,
  Building2,
  UserCircle2,
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
import { Separator } from "@repo/ui/components/ui/separator";
import { LocationSheet } from "../../../components/locations/location-sheet";
import { ZoneList } from "../../../components/locations/zone-list";
import { UnitList } from "../../../components/locations/unit-list";
import { LocationManagementTab } from "../../../components/locations/location-management-tab";
import { LocationStockTable } from "../../../components/locations/location-stock-table";
import { db } from "@repo/db";
import Image from "next/image";
import { LocationMap } from "../../../components/locations/location-map";

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

  const activeTab = tab || "hierarchy";
  const zoneCount = location.zones.length;
  const unitCount = location.storageUnits?.length ?? 0;
  const childCount = location.childLocations.length;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top bar: breadcrumb + identity + primary actions */}
      <div className="border-b bg-white">
        <div className="px-8 pt-5">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4">
            <Link
              href="/locations"
              className="flex items-center gap-1.5 hover:text-[#1D1D1F] transition-colors">
              <ArrowLeft size={13} />
              Locations
            </Link>
            {location.parentLocation && (
              <>
                <ChevronRight size={12} className="opacity-40" />
                <Link
                  href={`/locations/${location.parentLocation.id}`}
                  className="hover:text-[#1D1D1F] transition-colors">
                  {location.parentLocation.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="opacity-40" />
            <span className="text-[#1D1D1F] font-medium">{location.name}</span>
          </nav>

          <div className="flex items-start justify-between pb-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[20px] font-semibold text-[#1D1D1F] tracking-tight">
                    {location.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="capitalize font-medium text-[11px] px-2 py-0">
                    {location.locationType.toLowerCase().replace("_", " ")}
                  </Badge>
                  {location.isDefault && (
                    <Badge className="bg-blue-600 text-white border-0 text-[11px] px-2 py-0 hover:bg-blue-600">
                      Default location
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[13px] text-muted-foreground">
                  {location.code ? (
                    <button className="flex items-center gap-1 hover:text-[#1D1D1F] transition-colors group">
                      <span className="font-mono">{location.code}</span>
                      <Copy
                        size={11}
                        className="opacity-0 group-hover:opacity-60 transition-opacity"
                      />
                    </button>
                  ) : (
                    <span className="italic">No location code assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <LocationSheet
                locations={allLocations}
                members={members}
                location={{ parentLocationId: location.id }}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus size={14} />
                  Sub-location
                </Button>
              </LocationSheet>
              <LocationSheet
                location={location}
                locations={allLocations}
                members={members}
                isEdit>
                <Button size="sm" className="gap-1.5">
                  <Settings size={14} />
                  Configure
                </Button>
              </LocationSheet>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 p-8">
        {/* Left rail: details + stats */}
        <div className="space-y-5">
          {/* Branch Image/Banner Card */}
          <Card className="shadow-none border-[#E5E5E5] overflow-hidden">
            {location?.settings?.imageUrl ? (
              <div className="relative h-[160px] w-full">
                <Image
                  src={location.settings.imageUrl}
                  alt={`${location.name} branch custom image`}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <span className="text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm bg-black/35 px-2 py-1 rounded">
                    Branch Showcase Image
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border-b flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                  <Building2 size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[12px] font-semibold text-slate-900">Custom Home Page Image</h4>
                  <p className="text-[11px] text-muted-foreground leading-normal max-w-[200px]">
                    Customize this branch with a showcase image for your public homepage.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-3 gap-2.5">
            <StatTile label="Sub-locations" value={childCount} />
            <StatTile label="Zones" value={zoneCount} accent="orange" />
            <StatTile label="Units" value={unitCount} accent="violet" />
          </div>

          <Card className="shadow-none border-[#E5E5E5]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DetailRow
                icon={<UserCircle2 size={14} />}
                label="Manager"
                value={location.manager?.user?.name || "Unassigned"}
                muted={!location.manager?.user?.name}
              />
              <DetailRow
                icon={<Building2 size={14} />}
                label="Parent"
                value={location.parentLocation?.name || "Root location"}
                muted={!location.parentLocation?.name}
              />

              <Separator className="my-3" />

              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  Description
                </span>
                <p className="text-[13px] text-[#1D1D1F] leading-relaxed">
                  {location.description || (
                    <span className="italic text-muted-foreground">
                      No description provided.
                    </span>
                  )}
                </p>
              </div>

              <Separator className="my-3" />

              <div className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  Address
                </span>
                {location.address ? (
                  <div className="text-[13px] text-[#1D1D1F] leading-relaxed">
                    <p>{(location.address as any).street}</p>
                    <p>
                      {(location.address as any).city},{" "}
                      {(location.address as any).state}{" "}
                      {(location.address as any).zipCode}
                    </p>
                    <p className="text-muted-foreground">
                      {(location.address as any).country}
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] italic text-muted-foreground">
                    No address added
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Map Card */}
          <Card className="shadow-none border-[#E5E5E5]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <MapPin size={14} className="text-red-500" />
                Physical Location Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap
                latitude={location?.settings?.latitude}
                longitude={location?.settings?.longitude}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: tabbed workspace */}
        <div className="min-w-0">
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="h-10 w-full justify-start gap-1 rounded-lg bg-[#F0F0F0] p-1">
              <Link href={`/locations/${id}?tab=hierarchy`} className="flex-1">
                <TabsTrigger
                  value="hierarchy"
                  className="gap-1.5 w-full data-[state=active]:shadow-sm text-[13px]">
                  <Layers size={14} />
                  Hierarchy
                  <CountBadge n={childCount + zoneCount} />
                </TabsTrigger>
              </Link>
              <Link href={`/locations/${id}?tab=stock`} className="flex-1">
                <TabsTrigger
                  value="stock"
                  className="gap-1.5 w-full data-[state=active]:shadow-sm text-[13px]">
                  <Database size={14} />
                  Stock
                  <CountBadge n={stockTotal} />
                </TabsTrigger>
              </Link>
              <Link href={`/locations/${id}?tab=storage`} className="flex-1">
                <TabsTrigger
                  value="storage"
                  className="gap-1.5 w-full data-[state=active]:shadow-sm text-[13px]">
                  <Box size={14} />
                  Storage
                  <CountBadge n={unitCount} />
                </TabsTrigger>
              </Link>
              <Link href={`/locations/${id}?tab=management`} className="flex-1">
                <TabsTrigger
                  value="management"
                  className="gap-1.5 w-full data-[state=active]:shadow-sm text-[13px]">
                  <Settings size={14} />
                  Enterprise
                </TabsTrigger>
              </Link>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-6 mt-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Sub-locations
                  </h3>
                  <LocationSheet
                    locations={allLocations}
                    members={members}
                    location={{ parentLocationId: location.id }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 h-7 text-[13px] text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Plus size={13} />
                      Add
                    </Button>
                  </LocationSheet>
                </div>

                {location.childLocations.length === 0 ? (
                  <EmptyState
                    icon={<Layers size={20} />}
                    title="No sub-locations yet"
                    description="Add a sub-location to break this site down into floors, rooms, or storage areas."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {location.childLocations.map((child: any) => (
                      <Link key={child.id} href={`/locations/${child.id}`}>
                        <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-white hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-gray-50 border flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors shrink-0">
                              <MapPin size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-[13px] text-[#1D1D1F] truncate">
                                {child.name}
                              </div>
                              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
                                {child.locationType}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            size={15}
                            className="text-gray-300 group-hover:text-blue-500 shrink-0"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <ZoneList locationId={location.id} zones={location.zones} />
            </TabsContent>

            <TabsContent value="stock" className="mt-5">
              <Card className="shadow-none border-[#E5E5E5]">
                <CardHeader className="border-b py-3.5">
                  <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                    <Database size={15} className="text-blue-600" />
                    Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <LocationStockTable
                    locationId={location.id}
                    initialData={formattedStock}
                    totalCount={stockTotal}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage" className="mt-5">
              <UnitList
                locationId={location.id}
                zones={location.zones}
                units={location.storageUnits}
              />
            </TabsContent>

            <TabsContent value="management" className="mt-5">
              <LocationManagementTab location={location} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: number;
  accent?: "blue" | "orange" | "violet";
}) {
  const colors = {
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    orange: "text-orange-700 bg-orange-50 border-orange-100",
    violet: "text-violet-700 bg-violet-50 border-violet-100",
  }[accent];

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${colors}`}>
      <div className="text-[18px] font-bold leading-tight">{value}</div>
      <div className="text-[10px] uppercase font-semibold tracking-wide opacity-80 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0">
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={`text-[13px] font-medium text-right ${
          muted ? "text-muted-foreground italic font-normal" : "text-[#1D1D1F]"
        }`}>
        {value}
      </span>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1D1D1F]/8 text-[#1D1D1F]/70 leading-none">
      {n}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 border border-dashed rounded-lg bg-white text-center flex flex-col items-center gap-2">
      <div className="text-gray-300">{icon}</div>
      <p className="text-[13px] font-medium text-[#1D1D1F]">{title}</p>
      <p className="text-[13px] text-muted-foreground max-w-sm">
        {description}
      </p>
    </div>
  );
}
