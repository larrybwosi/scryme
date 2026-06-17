"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Plus } from "lucide-react";
import { PriceListDialog } from "./pricelist-dialog";

export function PriceListListClient({ tags }: { tags: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button className="gap-2" onClick={() => setIsOpen(true)}>
        <Plus size={16} />
        <span>Create Price List</span>
      </Button>
      <PriceListDialog
        availableTags={tags}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
