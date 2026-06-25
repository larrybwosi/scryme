import React from "react";
import {
  getInventoryProducts,
  getInventoryLocations,
  getCategories,
  getSuppliers,
} from "../actions/inventory";
import { InventoryTable } from "../../components/inventory/inventory-table";
import { InventoryFilters } from "../../components/inventory/inventory-filters";
import { PageHeader } from "../../components/page-header";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Filter, RotateCw, LayoutGrid, Download, Tag } from "lucide-react";
import { ProductSheet } from "../../components/inventory/product-sheet";
import { ProductImport } from "../../components/inventory/product-import";
import Link from "next/link";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    locationId?: string;
    categoryId?: string;
    supplierId?: string;
    stockLevel?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>;
}) {
  const params = await searchParams;

  const [products, locations, categories, suppliers] = await Promise.all([
    getInventoryProducts({
      search: params.search,
      locationId: params.locationId,
      categoryId: params.categoryId,
      supplierId: params.supplierId,
      stockLevel: params.stockLevel as any,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      groupByProduct: true,
    }),
    getInventoryLocations(),
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Inventory</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory/pricelists">
            <Button variant="outline" className="gap-2">
              <Tag size={16} />
              <span>Price Lists</span>
            </Button>
          </Link>
          <Link href="/inventory/categories">
            <Button variant="outline" className="gap-2">
              <LayoutGrid size={16} />
              <span>Categories</span>
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <RotateCw size={16} />
            <span>Reorder</span>
          </Button>
          <ProductImport>
            <Button variant="outline" className="gap-2">
              <Download size={16} />
              <span>Import</span>
            </Button>
          </ProductImport>
          <ProductSheet categories={categories}>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Add Product</span>
            </Button>
          </ProductSheet>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border-b w-fit pb-1">
            <button className="px-4 py-2 text-sm font-medium border-b-2 border-black -mb-[6px]">
              All product
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <Plus size={14} />
              View
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={14} />
            <span>View Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <InventoryFilters
            categories={categories}
            suppliers={suppliers}
            locations={locations}
          />

          <Button variant="outline" size="sm" className="ml-auto gap-2">
            <Filter size={14} />
            Manage Table
          </Button>
        </div>

        <InventoryTable data={products} />
      </div>
    </div>
  );
}
