import React from "react";
import { PageHeader } from "@/components/page-header";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import Link from "next/link";
import { getStockRequestLocations, getStockLevels } from "@/app/actions/stock-management";
import { StockRequestForm } from "@/components/stocking/requests/stock-request-form";

export default async function NewStockRequestPage() {
  const [locations, stock] = await Promise.all([
    getStockRequestLocations(),
    getStockLevels({})
  ]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="New Stock Request"
          description="Create a new request for product variants from your branch."
          icon={<ShoppingCart size={24} />}
        />
        <Link href="/stocking/requests">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft size={18} />
            Back to Requests
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <StockRequestForm locations={locations} variants={stock} />
      </div>
    </div>
  );
}
