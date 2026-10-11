import { Metadata } from "next";
import React from "react";
import {
  getInventoryProducts,
  getInventoryLocations,
  getCategories,
  getSuppliers,
} from "../../actions/inventory";
import { InventoryTable } from "../../../components/inventory/inventory-table";
import { InventoryFilters } from "../../../components/inventory/inventory-filters";
import { Button } from "@repo/ui/components/ui/button";
import { Filter, Archive } from "lucide-react";
import Link from "next/link";
import { getOrganizationSettings } from "../../actions/organization";

export const metadata: Metadata = {
  title: "Archived Items",
  description: "View and manage archived inventory products and catalog items.",
};

export default async function ArchivedPage({
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

  const [archivedProducts, locations, categories, suppliers, organization] =
    await Promise.all([
      getInventoryProducts({
        search: params.search,
        locationId: params.locationId,
        categoryId: params.categoryId,
        supplierId: params.supplierId,
        stockLevel: params.stockLevel as any,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        groupByProduct: true,
        isArchived: true,
      }),
      getInventoryLocations(),
      getCategories(),
      getSuppliers(),
      getOrganizationSettings(),
    ]);
  const currency = organization?.settings?.defaultCurrency || "USD";

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-foreground">Archived Items</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Archived products are hidden across sales channels and active views. You can view or restore them at any time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" className="gap-2">
              Back to Active Items
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <InventoryFilters
            categories={categories}
            suppliers={suppliers}
            locations={locations}
          />
        </div>

        <InventoryTable data={archivedProducts} currency={currency} />
      </div>
    </div>
  );
}
