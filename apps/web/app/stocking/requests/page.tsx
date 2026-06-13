import React from "react";
import { PageHeader } from "../../../components/page-header";
import { ShoppingCart, Plus, ListFilter } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { getStockRequestList, getAggregatedStockRequests } from "../../actions/stock-management";
import Link from "next/link";
import { StockRequestTable } from "../../../components/stocking/requests/stock-request-table";
import { AggregatedRequestTable } from "../../../components/stocking/requests/aggregated-request-table";

export default async function StockRequestsPage() {
  const [requests, aggregatedItems] = await Promise.all([
    getStockRequestList(),
    getAggregatedStockRequests(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Stock Requests"
          description="Manage and fulfill product requests from different branches."
          icon={<ShoppingCart size={24} />}
        />
        <Link href="/stocking/requests/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={18} />
            New Request
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">Individual Requests</TabsTrigger>
            <TabsTrigger value="aggregated">Compiled List (Admins)</TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" className="gap-2">
            <ListFilter size={16} />
            Filter
          </Button>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <StockRequestTable data={requests} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aggregated" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <AggregatedRequestTable data={aggregatedItems} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
