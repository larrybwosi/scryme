"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Settings, Check, X as XIcon, Send } from "lucide-react";
import { AddPriceListItemDialog } from "./add-pricelist-item-dialog";
import { PriceListDialog } from "./pricelist-dialog";
import { PricingRuleDialog } from "./pricing-rule-dialog";
import { PriceApprovalStatus } from "@repo/db/client";
import { submitPriceListForApproval, approvePriceList, rejectPriceList } from "../../app/actions/pricing";
import { toast } from "sonner";

export function PriceListDetailClient({
  priceList,
  products,
  tags,
  categories
}: {
  priceList: any,
  products: any[],
  tags: string[],
  categories: any[]
}) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmitForApproval = async () => {
    setLoading(true);
    try {
      await submitPriceListForApproval(priceList.id);
      toast.success("Submitted for approval");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approvePriceList(priceList.id);
      toast.success("Price list approved");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;

    setLoading(true);
    try {
      await rejectPriceList(priceList.id, reason);
      toast.success("Price list rejected");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {priceList.approvalStatus === PriceApprovalStatus.DRAFT && (
        <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleSubmitForApproval} disabled={loading}>
          <Send size={16} />
          <span>Submit for Approval</span>
        </Button>
      )}

      {priceList.approvalStatus === PriceApprovalStatus.PENDING_APPROVAL && (
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50" onClick={handleApprove} disabled={loading}>
            <Check size={16} />
            <span>Approve</span>
          </Button>
          <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleReject} disabled={loading}>
            <XIcon size={16} />
            <span>Reject</span>
          </Button>
        </div>
      )}

      {priceList.approvalStatus === PriceApprovalStatus.REJECTED && (
        <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={handleSubmitForApproval} disabled={loading}>
          <Send size={16} />
          <span>Resubmit</span>
        </Button>
      )}

      <Button variant="outline" className="gap-2" onClick={() => setIsAddRuleOpen(true)}>
        <Plus size={16} />
        <span>Add Rule</span>
      </Button>
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

      <PricingRuleDialog
        priceListId={priceList.id}
        isOpen={isAddRuleOpen}
        onOpenChange={setIsAddRuleOpen}
        products={products}
        categories={categories}
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
