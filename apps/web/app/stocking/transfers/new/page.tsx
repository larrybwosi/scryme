import { Metadata } from "next";
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
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";

export const metadata: Metadata = {
  title: "New Stock Transfer",
  description: "Initiate an inter-warehouse stock transfer movement.",
};

export default async function NewTransferPage() {
  const [locations, products, context] = await Promise.all([
    getInventoryLocations(),
    getInventoryProducts({ stockLevel: "all" }),
    getServerAuth(),
  ]);

  let userRole = "ADMIN";
  if (context?.memberId) {
    const member = await db.member.findUnique({
      where: { id: context.memberId },
      select: { role: true },
    });
    if (member?.role) userRole = member.role;
  }

  const handleSubmit = async (formData: FormData) => {
    "use server";
    const fromLocationId = formData.get("fromLocationId") as string;
    const toLocationId = formData.get("toLocationId") as string;
    const priority = formData.get("priority") as any;
    const notes = formData.get("notes") as string;
    const autoApproveAndShip = formData.get("autoApproveAndShip") === "true";

    const attachmentIdsRaw = formData.get("attachmentIds") as string;
    let attachmentIds: string[] = [];
    if (attachmentIdsRaw) {
      try {
        attachmentIds = JSON.parse(attachmentIdsRaw);
      } catch (err) {
        console.error("Failed to parse attachmentIds:", err);
      }
    }

    if (fromLocationId === toLocationId) {
      throw new Error("Source and destination locations must be different");
    }

    const itemsRaw = formData.get("items") as string;
    let items: any[] = [];
    if (itemsRaw) {
      try {
        const parsed = JSON.parse(itemsRaw);
        if (Array.isArray(parsed)) {
          items = parsed.map((item: any) => ({
            variantId: item.variantId,
            quantity: Number(item.quantity),
            batchNumber: item.batchNumber || undefined,
            serialNumbers: item.serialNumbers || [],
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
        priority,
        items,
        notes,
        attachmentIds,
        autoApproveAndShip,
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
          description="Initiate an inter-branch transfer movement with lot tracking and barcode scanning."
          icon={<Plus size={24} />}
        />
      </div>

      <NewTransferForm
        products={products as any}
        locations={locations}
        onSave={handleSubmit}
        userRole={userRole}
      />
    </div>
  );
}
