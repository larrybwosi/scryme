import React from "react";
import { getPriceList, getProductsForPricing, getUniqueCustomerTags } from "../../../actions/pricing";
import { getCategories } from "../../../actions/inventory";
import { PriceListItemTable } from "../../../../components/inventory/pricelist-item-table";
import { PricingRuleTable } from "../../../../components/inventory/pricing-rule-table";
import { PriceListCustomerTable } from "../../../../components/inventory/pricelist-customer-table";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Globe, Tag, Calendar, ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { Badge } from "@repo/ui/components/ui/badge";
import { PriceListDetailClient } from "../../../../components/inventory/pricelist-detail-client";
import { PriceApprovalStatus } from "@repo/db/client";

export default async function PriceListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [priceList, products, tags, categories] = await Promise.all([
    getPriceList(id),
    getProductsForPricing(),
    getUniqueCustomerTags(),
    getCategories(),
  ]);

  if (!priceList) {
    return <div>Price List not found</div>;
  }

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
              <BreadcrumbLink href="/inventory/pricelists">Price Lists</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{priceList.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1D1D1F]">{priceList.name}</h1>
              {priceList.isGlobal && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Globe size={12} className="mr-1" />
                  Global Base
                </Badge>
              )}
              <Badge variant={priceList.isActive ? "default" : "secondary"} className={priceList.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" : ""}>
                {priceList.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  priceList.approvalStatus === PriceApprovalStatus.APPROVED
                    ? "bg-green-50 text-green-700 border-green-200"
                    : priceList.approvalStatus === PriceApprovalStatus.PENDING_APPROVAL
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : priceList.approvalStatus === PriceApprovalStatus.REJECTED
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {priceList.approvalStatus.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{priceList.description || "No description provided."}</p>
          </div>

          <div className="flex items-center gap-2">
            <PriceListDetailClient priceList={priceList} products={products} tags={tags} categories={categories} />
          </div>
        </div>

        {priceList.approvalStatus === PriceApprovalStatus.REJECTED && priceList.approvalNotes && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex flex-col gap-1">
            <span className="text-xs font-bold text-red-700 uppercase">Rejection Reason</span>
            <p className="text-sm text-red-600">{priceList.approvalNotes}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="bg-white p-3 rounded-lg border flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Targeting</span>
            <div className="flex flex-wrap gap-1">
               {priceList.isGlobal ? (
                 <span className="text-sm text-gray-600">All Customers</span>
               ) : priceList.customerTags?.length > 0 ? (
                 priceList.customerTags.map((tag: string) => (
                   <Badge key={tag} variant="secondary" className="text-[10px] bg-gray-100">{tag}</Badge>
                 ))
               ) : (
                 <span className="text-sm text-gray-400 italic">No tags assigned</span>
               )}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Validity</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} />
              <span>
                {priceList.validFrom ? new Date(priceList.validFrom).toLocaleDateString() : "Immediate"}
                {priceList.validTo ? ` — ${new Date(priceList.validTo).toLocaleDateString()}` : " (No expiry)"}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Financials</span>
            <span className="text-sm text-gray-600">Currency: <span className="font-bold">{priceList.currency}</span> • Priority: <span className="font-bold">{priceList.priority}</span></span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="bg-white border mb-4">
          <TabsTrigger value="items">Price List Items ({priceList.items.length})</TabsTrigger>
          <TabsTrigger value="rules">Pricing Rules ({priceList.rules.length})</TabsTrigger>
          <TabsTrigger value="customers">Customers ({priceList.customers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-0">
          <PriceListItemTable priceListId={priceList.id} items={priceList.items} />
        </TabsContent>
        <TabsContent value="rules" className="mt-0">
          <PricingRuleTable priceListId={priceList.id} rules={priceList.rules} currency={priceList.currency} />
        </TabsContent>
        <TabsContent value="customers" className="mt-0">
          <PriceListCustomerTable priceListId={priceList.id} customers={priceList.customers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
