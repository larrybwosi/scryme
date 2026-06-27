"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Plus, TrendingUp, Search, Filter } from "lucide-react";
import { useOrg } from "../../../components/org-context";
import { getDeals, updateDealStage, createDeal } from "../../actions/deals";
import { KanbanBoard } from "./kanban-board";
import { StatCard } from "../../../components/ui/stat-card";
import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { toast } from "sonner";
import { DealForm } from "./deal-form";

export function KanbanBoardView() {
  const { organizationId } = useOrg();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: deals = [],
    mutate,
    isLoading,
  } = useSWR(organizationId ? ["deals", organizationId] : null, () =>
    getDeals(organizationId),
  );

  const handleDealUpdate = async (dealId: string, updates: any) => {
    // Optimistic update
    const originalDeals = [...deals];
    const updatedDeals = deals.map((d: any) =>
      d.id === dealId ? { ...d, data: { ...d.data, ...updates } } : d,
    );

    mutate(updatedDeals, false);

    const result = await updateDealStage(dealId, updates.stage);
    if (!result.success) {
      toast.error("Failed to update deal stage");
      mutate(originalDeals);
    } else {
      toast.success("Deal moved");
    }
  };

  const totalValue = deals.reduce(
    (sum: number, deal: any) => sum + (Number(deal.data.amount) || 0),
    0,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">
              Sales Pipeline
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage your deals and track progress across stages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Filter size={15} />
              Filters
            </Button>
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2 h-9">
                  <Plus size={15} />
                  New Deal
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-[440px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create New Deal</SheetTitle>
                </SheetHeader>
                <DealForm
                  onSuccess={() => {
                    setIsCreateOpen(false);
                    mutate();
                  }}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Open Deals"
            value={deals.length}
            sub="Active in pipeline"
            icon={TrendingUp}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <StatCard
            title="Pipeline Value"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(totalValue)}
            sub="Total estimated value"
            icon={TrendingUp}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
        </div>
      </div>

      <div className="flex-1 px-8 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <KanbanBoard deals={deals} onDealUpdate={handleDealUpdate} />
        )}
      </div>
    </div>
  );
}
