import React from "react";
import { PageHeader } from "../../../../../components/page-header";
import {
  getInventoryLocations,
  getInventoryProducts,
} from "../../../../actions/inventory";
import {
  getStockTransferDetails,
  updateStockTransfer,
} from "../../../../actions/stock-management";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { EditTransferForm } from "../../../../../components/stocking/edit-transfer-form";

export default async function EditTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transfer = await getStockTransferDetails(id);

  if (!transfer) notFound();

  // If status is COMPLETED, CANCELLED, or REJECTED, do not allow editing
  if (["COMPLETED", "CANCELLED", "REJECTED"].includes(transfer.status)) {
    redirect(`/stocking/transfers/${id}`);
  }

  const [locations, products] = await Promise.all([
    getInventoryLocations(),
    getInventoryProducts({ stockLevel: "all" }),
  ]);

  const handleSubmit = async (formData: FormData) => {
    "use server";
    const fromLocationId = formData.get("fromLocationId") as string;
    const toLocationId = formData.get("toLocationId") as string;
    const notes = formData.get("notes") as string;
    const priority = formData.get("priority") as string;

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
      await updateStockTransfer(id, {
        fromLocationId,
        toLocationId,
        items,
        notes,
        priority,
      });
      redirect(`/stocking/transfers/${id}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Link href={`/stocking/transfers/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <PageHeader
          title={`Edit Stock Transfer: ${transfer.transferNumber}`}
          description="Update details and items for this stock transfer."
          icon={<Edit size={24} />}
        />
      </div>

      <EditTransferForm
        transfer={transfer}
        products={products}
        locations={locations}
        onSave={handleSubmit}
      />
    </div>
  );
}
