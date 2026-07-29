import React from "react";
import { PageHeader } from "../../../../components/page-header";
import {
  getInventoryLocations,
  getInventoryProducts,
} from "../../../actions/inventory";
import { createStockTransfer } from "../../../actions/stock-management";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewTransferForm } from "../../../../components/stocking/new-transfer-form";

export default async function NewTransferPage() {
  const [locations, products] = await Promise.all([
    getInventoryLocations(),
    getInventoryProducts({ stockLevel: "all" }),
  ]);

  const handleSubmit = async (formData: FormData) => {
    "use server";
    const fromLocationId = formData.get("fromLocationId") as string;
    const toLocationId = formData.get("toLocationId") as string;
    const notes = formData.get("notes") as string;

    if (fromLocationId === toLocationId) {
      throw new Error("Source and destination locations must be different");
    }

    const itemsRaw = formData.get("items") as string;
    let items: { variantId: string; quantity: number }[] = [];
    if (itemsRaw) {
      try {
        const parsed = JSON.parse(itemsRaw);
        if (Array.isArray(parsed)) {
          items = parsed.map((item: any) => ({
            variantId: item.variantId,
            quantity: Number(item.quantity),
          }));
        }
      } catch (e) {
        console.error("Failed to parse stock transfer items:", e);
      }
    }

    if (items.length > 0) {
      await createStockTransfer({
        fromLocationId,
        toLocationId,
        items,
        notes,
      });
      redirect("/stocking/transfers");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Link href="/stocking/transfers">
          <Button variant="ghost" size="icon">
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
        products={products}
        locations={locations}
        onSave={handleSubmit}
      />
    </div>
  );
}
