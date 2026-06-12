import React from "react";
import { PageHeader } from "../../../../components/page-header";
import { getInventoryLocations } from "../../../actions/inventory";
import { createStockTransfer } from "../../../actions/stock-management";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewTransferForm } from "../../../../components/stocking/new-transfer-form";

export default async function NewTransferPage() {
  const locations = await getInventoryLocations();

  const handleSave = async (data: {
    fromLocationId: string;
    toLocationId: string;
    items: { variantId: string; quantity: number }[];
    notes?: string;
  }) => {
    "use server";
    await createStockTransfer(data);
    redirect("/stocking/transfers");
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Link href="/stocking/transfers">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <PageHeader
          title="New Stock Transfer"
          description="Initiate a movement of goods between your business locations."
          icon={<Plus size={24} />}
        />
      </div>

      <NewTransferForm
        locations={locations}
        onSave={handleSave}
      />
    </div>
  );
}
