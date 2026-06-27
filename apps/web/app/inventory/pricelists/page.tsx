import React from "react";
import { getPriceLists, getUniqueCustomerTags } from "../../actions/pricing";
import { PriceListTable } from "../../../components/inventory/pricelist-table";
import { PageHeader } from "../../../components/page-header";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/ui/breadcrumb";
import { PriceListListClient } from "../../../components/inventory/pricelist-list-client";

export default async function PriceListsPage() {
  const [priceLists, tags] = await Promise.all([
    getPriceLists(),
    getUniqueCustomerTags(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/inventory">Inventory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Price Lists</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Price Lists</h1>
            <p className="text-sm text-gray-500">
              Manage custom pricing for customer groups and seasonal promotions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PriceListListClient tags={tags} />
          </div>
        </div>
      </div>

      <PriceListTable data={priceLists} availableTags={tags} />
    </div>
  );
}
