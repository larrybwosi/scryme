"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { ShoppingCart, Plus, Search, FileDown } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { getStockRequestList, getAggregatedStockRequests } from "@/app/actions/stock-management";
import Link from "next/link";
import { StockRequestTable } from "@/components/stocking/requests/stock-request-table";
import { AggregatedRequestTable } from "@/components/stocking/requests/aggregated-request-table";
import { Input } from "@repo/ui/components/ui/input";
import { useDebounce } from "use-debounce";

export default function StockRequestsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const [requests, setRequests] = useState<any[]>([]);
  const [aggregatedItems, setAggregatedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === "all") {
          const data = await getStockRequestList({ search: debouncedSearch });
          setRequests(data);
        } else {
          const data = await getAggregatedStockRequests({ search: debouncedSearch });
          setAggregatedItems(data);
        }
      } catch (error) {
        console.error("Failed to fetch stock requests:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab, debouncedSearch]);

  const downloadPdf = () => {
    const endpoint = activeTab === "all" ? "requests" : "aggregated-requests";
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);

    window.open(`/api/stocking/documents/${endpoint}?${params.toString()}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Stock Requests"
          description="Manage and fulfill product requests from different branches."
          icon={<ShoppingCart size={24} />}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={downloadPdf}>
            <FileDown size={18} />
            Download PDF
          </Button>
          <Link href="/stocking/requests/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={18} />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">Individual Requests</TabsTrigger>
            <TabsTrigger value="aggregated">Compiled List (Admins)</TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <StockRequestTable data={requests} />
              {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aggregated" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <AggregatedRequestTable data={aggregatedItems} />
              {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
