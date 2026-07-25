import React from "react";
import {
  getLocation,
  getLocations,
  getLocationStock,
  getMembersForSelect,
  LocationSettings,
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
import { Separator } from "@repo/ui/components/ui/separator";
import { LocationSheet } from "../../../components/locations/location-sheet";
import { ZoneList } from "../../../components/locations/zone-list";
import { UnitList } from "../../../components/locations/unit-list";
import { LocationManagementTab } from "../../../components/locations/location-management-tab";
import { LocationStockTable } from "../../../components/locations/location-stock-table";
import Image from "next/image";
import { LocationMap } from "../../../components/locations/location-map";
import {
  createSearchParamsCache,
  parseAsString,
  createSerializer,
} from "nuqs/server";

// Create search params cache for server component
const searchParamsCache = createSearchParamsCache({
  tab: parseAsString.withDefault("hierarchy"),
  search: parseAsString.withDefault(""),
  page: parseAsString.withDefault("1"),
  sortBy: parseAsString.withDefault(""),
  sortOrder: parseAsString.withDefault("asc"),
});

// Create serializer for generating URLs with search params
const serialize = createSerializer({
  tab: parseAsString.withDefault("hierarchy"),
  search: parseAsString.withDefault(""),
  page: parseAsString.withDefault("1"),
  sortBy: parseAsString.withDefault(""),
  sortOrder: parseAsString.withDefault("asc"),
});

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
  const rawSearchParams = await searchParams;

  // Parse search params using nuqs
  const parsedParams = searchParamsCache.parse(rawSearchParams);
  const { search, page, sortBy, sortOrder, tab } = parsedParams;

  const location = await getLocation(id);
  const allLocations = await getLocations();
  const members = await getMembersForSelect();

  const { data: formattedStock, total: stockTotal } = await getLocationStock({
    locationId: id,
    search,
    page: page ? parseInt(page) : 1,
    pageSize: 50,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
  });

  if (!location) {
    notFound();
  }

  const settings = (location.settings as LocationSettings) || {};
  const activeTab = tab || "hierarchy";
  const zoneCount = location.zones.length;
  const unitCount = location.storageUnits?.length ?? 0;
  const childCount = location.childLocations.length;

  const stats: { label: string; value: number }[] = [
    { label: "Sub-locations", value: childCount },
    { label: "Zones", value: zoneCount },
    { label: "Storage units", value: unitCount },
    { label: "SKUs tracked", value: stockTotal },
  ];

  // Helper function to generate tab URLs with current search params
  const getTabUrl = (tabValue: string) => {
    const params = { ...parsedParams, tab: tabValue };
    return `/locations/${id}?${serialize(params)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="px-8 pt-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 mb-4">
            <Link
              href="/locations"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <ArrowLeft size={12} strokeWidth={2.25} />
              <span className="uppercase tracking-wide">Locations</span>
            </Link>
            {location.parentLocation && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <Link
                  href={`/locations/${location.parentLocation.id}`}
                  className="uppercase tracking-wide hover:text-slate-900 transition-colors">
                  {location.parentLocation.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-slate-300" />
            <span className="uppercase tracking-wide text-slate-900">
              {location.name}
            </span>
          </nav>

          <div className="flex items-start justify-between pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-sm bg-slate-900 flex items-center justify-center text-white shrink-0 mt-0.5">
                <MapPin size={17} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[19px] font-semibold text-slate-900 tracking-tight leading-none">
                    {location.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="rounded-sm capitalize font-semibold text-[10px] tracking-wide px-1.5 py-0 border-slate-300 text-slate-600">
                    {location.locationType.toLowerCase().replace("_", " ")}
                  </Badge>
                  {location.isDefault && (
                    <Badge className="rounded-sm bg-slate-900 text-white border-0 text-[10px] font-semibold tracking-wide px-1.5 py-0 hover:bg-slate-900">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-500">
                  {location.code ? (
                    <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors group">
                      <span className="font-mono bg-slate-100 border border-slate-200 rounded-sm px-1.5 py-0.5 text-[11px] text-slate-700">
                        {location.code}
                      </span>
                      <Copy
                        size={11}
                        className="opacity-0 group-hover:opacity-60 transition-opacity"
                      />
                    </button>
                  ) : (
                    <span className="italic text-slate-400">
                      No location code assigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LocationSheet
                locations={allLocations}
                members={members}
                location={{ parentLocationId: location.id }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-sm gap-1.5 border-slate-300 text-slate-700">
                  <Plus size={13} />
                  Sub-location
                </Button>
              </LocationSheet>
              <LocationSheet
                location={location}
                locations={allLocations}
                members={members}
                isEdit>
                <Button
                  size="sm"
                  className="rounded-sm gap-1.5 bg-slate-900 hover:bg-slate-800">
                  <Settings size={13} />
                  Configure
                </Button>
              </LocationSheet>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-3 px-0.5 ${
                  i !== 0 ? "border-l border-slate-100 pl-4" : ""
                }`}>
                <div className="text-[20px] font-semibold text-slate-900 leading-none tabular-nums">
                  {s.value}
                </div>
                <div className="text-[10px] uppercase font-semibold tracking-wide text-slate-400 mt-1.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 p-8">
        {/* Left rail */}
        <div className="space-y-5">
          <Panel title="Overview">
            {settings.imageUrl ? (
              <div className="relative h-35 w-full border-b border-slate-200">
                <Image
                  src={settings.imageUrl}
                  alt={`${location.name} branch custom image`}
                  fill
                  className="object-cover"
                  priority
                />
                <span className="absolute bottom-2 left-2 text-white text-[9px] font-semibold uppercase tracking-wider bg-black/50 px-1.5 py-0.5 rounded-sm">
                  Branch showcase image
                </span>
              </div>
            ) : (
              <div className="px-4 py-5 bg-slate-50 border-b border-slate-200 flex flex-col items-center text-center gap-1.5">
                <Building2 size={16} className="text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-700">
                  No showcase image
                </p>
                <p className="text-[11px] text-slate-500 leading-normal max-w-52.5">
                  Add an image to represent this branch on the public homepage.
                </p>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              <DetailRow
                icon={<UserCircle2 size={13} />}
                label="Manager"
                value={location.manager?.user?.name || "Unassigned"}
                muted={!location.manager?.user?.name}
              />
              <DetailRow
                icon={<Building2 size={13} />}
                label="Parent"
                value={location.parentLocation?.name || "Root location"}
                muted={!location.parentLocation?.name}
              />
            </div>

            <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Description
              </span>
              <p className="text-[13px] text-slate-700 leading-relaxed">
                {location.description || (
                  <span className="italic text-slate-400">
                    No description provided.
                  </span>
                )}
              </p>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Address
              </span>
              {location.address ? (
                <div className="text-[13px] text-slate-700 leading-relaxed">
                  <p>{(location.address as any).street}</p>
                  <p>
                    {(location.address as any).city},{" "}
                    {(location.address as any).state}{" "}
                    {(location.address as any).zipCode}
                  </p>
                  <p className="text-slate-500">
                    {(location.address as any).country}
                  </p>
                </div>
              ) : (
                <p className="text-[13px] italic text-slate-400">
                  No address added
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Physical location">
            <div className="p-3">
              <LocationMap
                latitude={settings.latitude}
                longitude={settings.longitude}
              />
            </div>
          </Panel>
        </div>

        {/* Right: tabbed workspace */}
        <div className="min-w-0">
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="h-10 w-full justify-start gap-6 rounded-none bg-transparent border-b border-slate-200 p-0">
              <Link href={getTabUrl("hierarchy")} className="shrink-0">
                <TabsTrigger
                  value="hierarchy"
                  className="gap-1.5 rounded-none border-b-2 border-transparent px-0.5 pb-3 text-[13px] font-medium text-slate-500 data-[state=active]:border-b-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-slate-700 transition-colors">
                  <Layers size={14} />
                  Hierarchy
                  <CountBadge n={childCount + zoneCount} />
                </TabsTrigger>
              </Link>
              <Link href={getTabUrl("stock")} className="shrink-0">
                <TabsTrigger
                  value="stock"
                  className="gap-1.5 rounded-none border-b-2 border-transparent px-0.5 pb-3 text-[13px] font-medium text-slate-500 data-[state=active]:border-b-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-slate-700 transition-colors">
                  <Database size={14} />
                  Stock
                  <CountBadge n={stockTotal} />
                </TabsTrigger>
              </Link>
              <Link href={getTabUrl("storage")} className="shrink-0">
                <TabsTrigger
                  value="storage"
                  className="gap-1.5 rounded-none border-b-2 border-transparent px-0.5 pb-3 text-[13px] font-medium text-slate-500 data-[state=active]:border-b-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-slate-700 transition-colors">
                  <Box size={14} />
                  Storage
                  <CountBadge n={unitCount} />
                </TabsTrigger>
              </Link>
              <Link href={getTabUrl("management")} className="shrink-0">
                <TabsTrigger
                  value="management"
                  className="gap-1.5 rounded-none border-b-2 border-transparent px-0.5 pb-3 text-[13px] font-medium text-slate-500 data-[state=active]:border-b-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-slate-700 transition-colors">
                  <Settings size={14} />
                  Enterprise
                </TabsTrigger>
              </Link>
            </TabsList>

            <TabsContent value="hierarchy" className="space-y-6 mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionLabel>Sub-locations</SectionLabel>
                  <LocationSheet
                    locations={allLocations}
                    members={members}
                    location={{ parentLocationId: location.id }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-sm gap-1.5 h-7 text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                      <Plus size={13} />
                      Add
                    </Button>
                  </LocationSheet>
                </div>

                {location.childLocations.length === 0 ? (
                  <EmptyState
                    icon={<Layers size={18} />}
                    title="No sub-locations yet"
                    description="Add a sub-location to break this site down into floors, rooms, or storage areas."
                  />
                ) : (
                  <div className="border border-slate-200 divide-y divide-slate-200 bg-white">
                    {location.childLocations.map((child: any) => (
                      <Link key={child.id} href={`/locations/${child.id}`}>
                        <div className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:border-slate-300 transition-colors shrink-0">
                              <MapPin size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-[13px] text-slate-900 truncate">
                                {child.name}
                              </div>
                              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wide">
                                {child.locationType}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-slate-300 group-hover:text-slate-600 shrink-0"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <ZoneList locationId={location.id} zones={location.zones} />
            </TabsContent>

            <TabsContent value="stock" className="mt-6">
              <div className="border border-slate-200 bg-white">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                    <Database size={14} className="text-slate-500" />
                    Inventory
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                    {stockTotal} SKU{stockTotal === 1 ? "" : "s"}
                  </span>
                </div>
                <LocationStockTable
                  locationId={location.id}
                  locationName={location.name}
                  initialData={formattedStock}
                  totalCount={stockTotal}
                />
              </div>
            </TabsContent>

            <TabsContent value="storage" className="mt-6">
              <UnitList
                locationId={location.id}
                zones={location.zones}
                units={location.storageUnits}
              />
            </TabsContent>

            <TabsContent value="management" className="mt-6">
              <LocationManagementTab location={location} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h3>
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
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="flex items-center gap-2 text-[12px] text-slate-500">
        {icon}
        {label}
      </span>
      <span
        className={`text-[13px] font-medium text-right ${
          muted ? "text-slate-400 italic font-normal" : "text-slate-900"
        }`}>
        {value}
      </span>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 leading-none tabular-nums">
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
    <div className="p-8 border border-dashed border-slate-300 bg-white text-center flex flex-col items-center gap-2">
      <div className="text-slate-300">{icon}</div>
      <p className="text-[13px] font-semibold text-slate-900">{title}</p>
      <p className="text-[13px] text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}
