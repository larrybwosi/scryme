"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { AddPriceListItemDialog } from "./add-pricelist-item-dialog";
import { PriceListDialog } from "./pricelist-dialog";

export function PriceListDetailClient({ priceList, products, tags }: { priceList: any, products: any[], tags: string[] }) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setIsConfigOpen(true)}>
        <Settings size={16} />
        <span>Configure</span>
      </Button>
      <Button className="gap-2" onClick={() => setIsAddItemOpen(true)}>
        <Plus size={16} />
        <span>Add Items</span>
      </Button>

      <AddPriceListItemDialog
        priceListId={priceList.id}
        isOpen={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        products={products}
      />

      <PriceListDialog
        priceList={priceList}
        isOpen={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        availableTags={tags}
      />
    </>
  );
}
