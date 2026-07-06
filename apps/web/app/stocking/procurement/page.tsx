"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Package,
  TrendingDown,
  Building2,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { getAggregatedStockRequests, getVariantSupplierPrices } from "@/app/actions/stock-management";
import { getSuppliers } from "@/app/actions/inventory";
import { Input } from "@repo/ui/components/ui/input";
import { toast } from "sonner";
import { FulfillmentModal } from "@/components/stocking/requests/fulfillment-modal";

export default function StockProcurementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fulfillmentItem, setFulfillmentItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getAggregatedStockRequests();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch procurement data:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Consolidated Procurement"
          description="View combined stock needs across the organization and place bulk orders with suppliers."
          icon={<ShoppingBag size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Unique Items Needed</p>
                <h3 className="text-3xl font-bold mt-1">{items.length}</h3>
              </div>
              <Package className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Quantity Requested</p>
                <h3 className="text-3xl font-bold mt-1">
                  {items.reduce((acc, item) => acc + item.totalRemaining, 0)}
                </h3>
              </div>
              <Building2 className="w-10 h-10 text-gray-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Critical Items</p>
                <h3 className="text-3xl font-bold mt-1 text-red-600">
                  {items.filter(item => item.requests.some((r: any) => r.priority === "URGENT" || r.priority === "HIGH")).length}
                </h3>
              </div>
              <TrendingDown className="w-10 h-10 text-red-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Procurement List</CardTitle>
              <CardDescription>Items with pending requests across all branches.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Preferred Supplier</TableHead>
                <TableHead className="text-center">Total Need</TableHead>
                <TableHead className="text-center">Branches</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading consolidated needs...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    No items found for procurement.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <TableRow key={item.variantId} className="hover:bg-gray-50/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">{item.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{item.categoryName}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{item.preferredSupplier}</span>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {item.totalRemaining}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.requests.length} Branches</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setFulfillmentItem(item)}
                      >
                        Source Item
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {fulfillmentItem && (
        <FulfillmentModal
          isOpen={!!fulfillmentItem}
          onClose={() => {
            setFulfillmentItem(null);
            fetchData();
          }}
          item={fulfillmentItem}
        />
      )}
    </div>
  );
}
