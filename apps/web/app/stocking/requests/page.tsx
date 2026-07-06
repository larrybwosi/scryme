"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  ShoppingCart,
  Plus,
  Search,
  FileDown,
  Building2,
  GitBranch,
  ChevronDown,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  getStockRequestList,
  getAggregatedStockRequests,
} from "@/app/actions/stock-management";
import Link from "next/link";
import { StockRequestTable } from "@/components/stocking/requests/stock-request-table";
import { AggregatedRequestTable } from "@/components/stocking/requests/aggregated-request-table";
import { Input } from "@repo/ui/components/ui/input";
import { useDebounce } from "use-debounce";
import { Badge } from "@repo/ui/components/ui/badge";

export default function StockRequestsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const [requests, setRequests] = useState<any[]>([]);
  const [aggregatedItems, setAggregatedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    locationId: "all",
    priority: "all",
    categoryId: "all",
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === "all") {
          const data = await getStockRequestList({
            search: debouncedSearch,
            status: "all",
            locationId: filters.locationId === "all" ? undefined : filters.locationId
          });
          setRequests(data);
        } else {
          const data = await getAggregatedStockRequests({
            search: debouncedSearch,
            locationId: filters.locationId,
            priority: filters.priority as any,
            categoryId: filters.categoryId
          });
          setAggregatedItems(data);
        }
      } catch (error) {
        console.error("Failed to fetch stock requests:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab, debouncedSearch, filters]);

  const downloadPdf = (level: "organization" | "branch") => {
    const endpoint =
      activeTab === "all" ? "requests" : "aggregated-requests";
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    params.append("level", level);

    const key = `${endpoint}-${level}`;
    setDownloading(key);

    window.open(
      `/api/stocking/documents/${endpoint}?${params.toString()}`,
      "_blank",
    );

    setTimeout(() => setDownloading(null), 1500);
  };

  const isBranchDownloading = (ep: string) =>
    downloading === `${ep}-branch`;
  const isOrgDownloading = (ep: string) =>
    downloading === `${ep}-organization`;
  const activeEndpoint =
    activeTab === "all" ? "requests" : "aggregated-requests";

  const [locations, setLocations] = useState<any[]>([]);
  useEffect(() => {
    import("@/app/actions/inventory").then(mod => {
      mod.getInventoryLocations().then(setLocations);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Stock Requests"
          description="Manage and fulfill product requests from different branches."
          icon={<ShoppingCart size={24} />}
        />
        <div className="flex items-center gap-2">
          {/* PDF Download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                <FileDown size={16} />
                Export PDF
                <ChevronDown size={14} className="text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-zinc-500 font-normal pb-1">
                Report scope
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer"
                  onClick={() => downloadPdf("branch")}>
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    {isBranchDownloading(activeEndpoint) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <GitBranch size={13} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Branch Report</p>
                    <p className="text-[11px] text-zinc-400">
                      Requests for your location
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer"
                  onClick={() => downloadPdf("organization")}>
                  <div className="w-7 h-7 rounded-md bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                    {isOrgDownloading(activeEndpoint) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Building2 size={13} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Organization Report</p>
                    <p className="text-[11px] text-zinc-400">
                      All branches combined
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <div className="px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Badge className="text-[9px] bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-50 rounded px-1.5 py-0 font-bold">
                    v3
                  </Badge>
                  Enterprise PDF template · Live data
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/stocking/requests/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={18} />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Individual Requests</TabsTrigger>
            <TabsTrigger value="aggregated">
              Compiled List{" "}
              <Badge className="ml-1.5 text-[9px] bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-50 rounded px-1.5 py-0 font-bold">
                Admins
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Search requests..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="border-zinc-200">
              <Filter size={16} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-2 px-2 text-xs font-medium text-zinc-500 uppercase tracking-wider border-r border-zinc-100 mr-2">
            <Filter size={12} />
            Quick Filters
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Branch:</span>
            <Select value={filters.locationId} onValueChange={(v) => setFilters({...filters, locationId: v})}>
              <SelectTrigger className="h-8 min-w-[150px] text-xs">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeTab === "aggregated" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Priority:</span>
                <Select value={filters.priority} onValueChange={(v) => setFilters({...filters, priority: v})}>
                  <SelectTrigger className="h-8 min-w-[120px] text-xs">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-400 hover:text-zinc-600 ml-auto h-8"
            onClick={() => setFilters({locationId: "all", priority: "all", categoryId: "all"})}
          >
            Clear All
          </Button>
        </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <StockRequestTable data={requests} />
              {loading && (
                <div className="p-8 text-center text-gray-500">
                  <Loader2
                    size={20}
                    className="animate-spin mx-auto mb-2 text-zinc-400"
                  />
                  Loading requests...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aggregated" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <AggregatedRequestTable data={aggregatedItems} />
              {loading && (
                <div className="p-8 text-center text-gray-500">
                  <Loader2
                    size={20}
                    className="animate-spin mx-auto mb-2 text-zinc-400"
                  />
                  Loading compiled data...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
