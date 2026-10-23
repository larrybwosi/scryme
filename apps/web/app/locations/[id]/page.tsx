import { Metadata } from "next";
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
  Settings,
  Layers,
  Box,
  ChevronRight,
  Database,
  Building2,
  UserCircle2,
  Grid3x3,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { LocationSheet } from "../../../components/locations/location-sheet";
import { ZoneList } from "../../../components/locations/zone-list";
import { UnitList } from "../../../components/locations/unit-list";
import { LocationManagementTab } from "../../../components/locations/location-management-tab";
import { LocationStockTable } from "../../../components/locations/location-stock-table";
import { CopyCodeButton } from "../../../components/locations/copy-code-button";
import Image from "next/image";
import { LocationMap } from "../../../components/locations/location-map";
import {
  createSearchParamsCache,
  parseAsString,
  createSerializer,
} from "nuqs/server";

const searchParsers = {
  tab: parseAsString.withDefault("hierarchy"),
  search: parseAsString.withDefault(""),
  page: parseAsString.withDefault("1"),
  sortBy: parseAsString.withDefault(""),
  sortOrder: parseAsString.withDefault("asc"),
};

const searchParamsCache = createSearchParamsCache(searchParsers);
const serialize = createSerializer(searchParsers);

const VALID_TABS = ["hierarchy", "stock", "storage", "management"] as const;
type TabValue = (typeof VALID_TABS)[number];

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

const formatType = (type?: string | null) =>
  (type ?? "").toLowerCase().replace(/_/g, " ");

export default async function LocationDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;

  const parsedParams = searchParamsCache.parse(rawSearchParams);
  const { search, page, sortBy, sortOrder, tab } = parsedParams;

  // Run independent queries concurrently in a single round trip
  const [
    location,
    allLocations,
    members,
    { data: formattedStock, total: stockTotal },
  ] = await Promise.all([
    getLocation(id),
    getLocations(),
    getMembersForSelect(),
    getLocationStock({
      locationId: id,
      search,
      page: page ? parseInt(page) : 1,
      pageSize: 50,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }),
  ]);

  if (!location) {
    notFound();
  }

  const settings = (location.settings as LocationSettings) || {};
  const activeTab: TabValue = (VALID_TABS as readonly string[]).includes(tab)
    ? (tab as TabValue)
    : "hierarchy";
  const zoneCount = location.zones.length;
  const unitCount = location.storageUnits?.length ?? 0;
  const childCount = location.childLocations.length;

  const address = location.address as
    | {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      }
    | null
    | undefined;
  const cityLine = [address?.city, [address?.state, address?.zipCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const hasAddress = !!(address?.street || cityLine || address?.country);

  // Stock tab keeps search/sort/page; other tabs start clean
  const getTabUrl = (tabValue: TabValue) => {
    const next =
      tabValue === "stock"
        ? { ...parsedParams, tab: tabValue }
        : { tab: tabValue };
    return `/locations/${id}${serialize(next)}`;
  };

  const stats: {
    label: string;
    value: number;
    icon: React.ReactNode;
    tab: TabValue;
  }[] = [
    { label: "Sub-locations", value: childCount, icon: <Layers size={15} />, tab: "hierarchy" },
    { label: "Zones", value: zoneCount, icon: <Grid3x3 size={15} />, tab: "hierarchy" },
    { label: "Storage units", value: unitCount, icon: <Box size={15} />, tab: "storage" },
    { label: "SKUs tracked", value: stockTotal, icon: <Package size={15} />, tab: "stock" },
  ];

  const tabs: {
    value: TabValue;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    { value: "hierarchy", label: "Hierarchy", icon: <Layers size={14} />, count: childCount + zoneCount },
    { value: "stock", label: "Stock", icon: <Database size={14} />, count: stockTotal },
    { value: "storage", label: "Storage", icon: <Box size={14} />, count: unitCount },
    { value: "management", label: "Enterprise", icon: <Settings size={14} /> },
  ];

  const managerName = location.manager?.user?.name;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1440px] px-4 pt-5 sm:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href="/locations"
              className="rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Locations
            </Link>
            {location.parentLocation && (
              <>
                <ChevronRight size={12} className="text-muted-foreground/50" aria-hidden />
                <Link
                  href={`/locations/${location.parentLocation.id}`}
                  className="rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {location.parentLocation.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-muted-foreground/50" aria-hidden />
            <span aria-current="page" className="font-semibold text-foreground">
              {location.name}
            </span>
          </nav>

          <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight text-foreground">
                    {location.name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border px-2.5 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                    {formatType(location.locationType)}
                  </Badge>
                  {location.isDefault && (
                    <Badge className="rounded-full border-0 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {location.code ? (
                    <CopyCodeButton code={location.code} />
                  ) : (
                    <span className="italic text-muted-foreground/70">
                      No location code
                    </span>
                  )}
                  {location.description && (
                    <span className="line-clamp-1 max-w-xl">
                      {location.description}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LocationSheet
                locations={allLocations}
                members={members}
                location={{ parentLocationId: location.id }}>
                <Button variant="outline" size="sm" className="gap-1.5 shadow-sm">
                  <Plus size={14} />
                  Sub-location
                </Button>
              </LocationSheet>
              <LocationSheet
                location={location}
                locations={allLocations}
                members={members}
                isEdit>
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <Settings size={14} />
                  Configure
                </Button>
              </LocationSheet>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-8">
        {/* Stat cards */}
        <section aria-label="Location summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={getTabUrl(s.tab)}
              className="group rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{s.label}</span>
                <span className="text-muted-foreground/60 transition-colors group-hover:text-primary">
                  {s.icon}
                </span>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums leading-none text-foreground">
                {s.value.toLocaleString()}
              </div>
            </Link>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left rail */}
          <aside className="space-y-6">
            <Panel title="Overview">
              {settings.imageUrl ? (
                <div className="relative h-40 w-full border-b border-border">
                  <Image
                    src={settings.imageUrl}
                    alt={`${location.name} branch image`}
                    fill
                    sizes="320px"
                    className="object-cover"
                    priority
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                    Branch showcase image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-6 text-center">
                  <Building2 size={20} className="text-muted-foreground/60" />
                  <p className="text-xs font-semibold text-foreground">
                    No showcase image
                  </p>
                  <p className="max-w-56 text-xs leading-normal text-muted-foreground">
                    Add an image to represent this branch on the public homepage.
                  </p>
                </div>
              )}

              <dl className="divide-y divide-border">
                <DetailRow
                  icon={<UserCircle2 size={14} />}
                  label="Manager"
                  value={managerName || "Unassigned"}
                  muted={!managerName}
                />
                <DetailRow
                  icon={<Building2 size={14} />}
                  label="Parent"
                  value={location.parentLocation?.name || "Root location"}
                  muted={!location.parentLocation?.name}
                />
              </dl>

              <div className="space-y-1.5 border-t border-border px-4 py-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {location.description || (
                    <span className="italic text-muted-foreground/70">
                      No description provided.
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1.5 border-t border-border px-4 py-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Address
                </h4>
                {hasAddress ? (
                  <address className="text-sm not-italic leading-relaxed text-foreground/90">
                    {address?.street && <p>{address.street}</p>}
                    {cityLine && <p>{cityLine}</p>}
                    {address?.country && (
                      <p className="text-muted-foreground">{address.country}</p>
                    )}
                  </address>
                ) : (
                  <p className="text-sm italic text-muted-foreground/70">
                    No address added
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="Map">
              <div className="p-3">
                <LocationMap
                  latitude={location.latitude ?? settings.latitude}
                  longitude={location.longitude ?? settings.longitude}
                />
              </div>
            </Panel>
          </aside>

          {/* Right: tabbed workspace */}
          <section className="min-w-0">
            <Tabs value={activeTab} className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="h-11 w-full min-w-max justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
                  {tabs.map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      asChild
                      className="h-11 shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-0.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                      <Link href={getTabUrl(t.value)} scroll={false}>
                        {t.icon}
                        {t.label}
                        {t.count ? <CountBadge n={t.count} /> : null}
                      </Link>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="hierarchy" className="mt-6 space-y-8">
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
                        className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                        <Plus size={14} />
                        Add
                      </Button>
                    </LocationSheet>
                  </div>

                  {childCount === 0 ? (
                    <EmptyState
                      icon={<Layers size={20} />}
                      title="No sub-locations yet"
                      description="Add a sub-location to break this site down into floors, rooms, or storage areas."
                    />
                  ) : (
                    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      {location.childLocations.map((child: any) => (
                        <li key={child.id}>
                          <Link
                            href={`/locations/${child.id}`}
                            className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                                <MapPin size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-foreground">
                                  {child.name}
                                </div>
                                <div className="text-xs capitalize text-muted-foreground">
                                  {formatType(child.locationType)}
                                </div>
                              </div>
                            </div>
                            <ChevronRight
                              size={16}
                              className="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <ZoneList locationId={location.id} zones={location.zones} />
              </TabsContent>

              <TabsContent value="stock" className="mt-6">
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Database size={15} className="text-muted-foreground" />
                      Inventory
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {stockTotal.toLocaleString()} SKU{stockTotal === 1 ? "" : "s"}
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
          </section>
        </div>
      </main>
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
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/40 px-4 py-2.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd
        className={`truncate text-right text-sm ${
          muted
            ? "font-normal italic text-muted-foreground/70"
            : "font-medium text-foreground"
        }`}>
        {value}
      </dd>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-muted-foreground">
      {n.toLocaleString()}
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
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Location Details",
  description:
    "Manage branch settings, terminal devices, and localized stock inventories.",
};