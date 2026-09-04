import { Metadata } from "next";
import React from "react";
import { PageHeader } from "@/components/page-header";
import { getStockLevels } from "../../actions/stock-management";
import {
  getInventoryLocations,
  getCategories,
  getSuppliers,
} from "../../actions/inventory";
import { TrendingUp } from "lucide-react";
import { StockingListTable } from "@/components/stocking/list/stocking-list-table";
import { StockingListFilters } from "@/components/stocking/list/stocking-list-filters";

export const metadata: Metadata = {
  title: "Stock Management",
  description: "Monitor real-time stock levels, warehouse allocations, and batch expirations.",
};


export default async function StockingListPage({
  searchParams,
}: {
  searchParams: Promise<{
    locationId?: string;
    search?: string;
    categoryId?: string;
    supplierId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    groupBy?: string;
  }>;
}) {
  const params = await searchParams;

  const [locations, categories, suppliers, stockLevels] = await Promise.all([
    getInventoryLocations(),
    getCategories(),
    getSuppliers(),
    getStockLevels({
      locationId: params.locationId,
      search: params.search,
      categoryId: params.categoryId,
      supplierId: params.supplierId,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      groupBy: params.groupBy,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <PageHeader
        title="Stocking List"
        description="View and manage stock levels across all products and locations."
        icon={<TrendingUp size={24} />}
      />

      <StockingListFilters
        locations={locations}
        categories={categories}
        suppliers={suppliers}
      />

      <StockingListTable data={stockLevels} />
    </div>
  );
}
