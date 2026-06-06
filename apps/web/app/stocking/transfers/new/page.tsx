import React from 'react';
import { PageHeader } from "../../../../components/page-header";
import { getInventoryLocations, getInventoryProducts } from "../../../actions/inventory";
import { createStockTransfer } from "../../../actions/stock-management";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from 'next/navigation';

export default async function NewTransferPage() {
  const [locations, products] = await Promise.all([
    getInventoryLocations(),
    getInventoryProducts({ stockLevel: "all" })
  ]);

  const handleSubmit = async (formData: FormData) => {
    "use server";
    const fromLocationId = formData.get("fromLocationId") as string;
    const toLocationId = formData.get("toLocationId") as string;
    const notes = formData.get("notes") as string;

    // In a real app, you'd handle multiple items dynamically.
    // For this prototype, we'll pick them from the form.
    const items: { variantId: string; quantity: number }[] = [];
    const variantId = formData.get("variantId") as string;
    const quantity = Number(formData.get("quantity"));

    if (variantId && quantity) {
      items.push({ variantId, quantity });
    }

    if (items.length > 0) {
      await createStockTransfer({
        fromLocationId,
        toLocationId,
        items,
        notes
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
        />
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-7">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Product</label>
                  <select name="variantId" className="w-full p-2 border rounded-md bg-white text-sm">
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.variantId} value={p.variantId}>{p.name} ({p.sku}) - {p.currentStock} in stock</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-2">
                  <Button type="button" variant="outline" className="w-full gap-2 border-dashed">
                    <Plus size={14} /> Add
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                  In a production app, added items would appear here.
                  <br />
                  <span className="text-xs font-medium">For this demo, use the fields above.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                name="notes"
                className="w-full p-3 border rounded-md text-sm min-h-[100px]"
                placeholder="Reason for transfer, handling instructions, etc."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Source Location</label>
                <select name="fromLocationId" required className="w-full p-2 border rounded-md bg-white text-sm">
                  <option value="">Select source...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Destination Location</label>
                <select name="toLocationId" required className="w-full p-2 border rounded-md bg-white text-sm">
                  <option value="">Select destination...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full gap-2">
                  <Save size={16} />
                  Create Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
