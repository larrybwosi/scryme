"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  BarChart2,
  SlidersHorizontal,
} from "lucide-react";
import { getDeals, updateDealStage } from "../../actions/deals";
import { KanbanBoard } from "./kanban-board";
import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { toast } from "sonner";
import { DealForm } from "./deal-form";

export function KanbanBoardView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState("discovery");

  const {
    data: deals = [],
    mutate,
    isLoading,
  } = useSWR(["deals"], () => getDeals());

  const handleDealUpdate = async (dealId: string, updates: any) => {
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
      toast.success("Deal stage updated");
    }
  };

  const handleAddDeal = (stage: string) => {
    setDefaultStage(stage);
    setIsCreateOpen(true);
  };

  const totalValue = deals.reduce(
    (sum: number, deal: any) => sum + (Number(deal.data.amount) || 0),
    0,
  );

  const wonDeals = deals.filter((d: any) => d.data.stage === "closed_won");
  const wonValue = wonDeals.reduce(
    (sum: number, d: any) => sum + (Number(d.data.amount) || 0),
    0,
  );
  const openDeals = deals.filter(
    (d: any) => !["closed_won", "closed_lost"].includes(d.data.stage),
  );
  const winRate =
    deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">
              Sales Pipeline
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {openDeals.length} open deal{openDeals.length !== 1 ? "s" : ""}{" "}
              &bull; {fmt(totalValue)} total pipeline value
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12.5px]"
            >
              <SlidersHorizontal size={13} />
              Filters
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-[12.5px]"
              onClick={() => {
                setDefaultStage("discovery");
                setIsCreateOpen(true);
              }}
            >
              <Plus size={13} />
              New Deal
            </Button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="flex items-center gap-6">
          {[
            {
              label: "Open Deals",
              value: openDeals.length,
              icon: TrendingUp,
              iconClass: "text-primary",
            },
            {
              label: "Pipeline",
              value: fmt(totalValue),
              icon: DollarSign,
              iconClass: "text-emerald-500",
            },
            {
              label: "Closed Won",
              value: fmt(wonValue),
              icon: Target,
              iconClass: "text-green-500",
            },
            {
              label: "Win Rate",
              value: `${winRate}%`,
              icon: BarChart2,
              iconClass: "text-violet-500",
            },
          ].map(({ label, value, icon: Icon, iconClass }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={14} className={iconClass} />
              <span className="text-[11.5px] text-muted-foreground">
                {label}:
              </span>
              <span className="text-[13px] font-semibold text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 px-4 pt-4 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              <p className="text-[12.5px] text-muted-foreground">
                Loading pipeline...
              </p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            deals={deals}
            onDealUpdate={handleDealUpdate}
            onAddDeal={handleAddDeal}
          />
        )}
      </div>

      {/* Create deal sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-[460px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Deal</SheetTitle>
          </SheetHeader>
          <DealForm
            onSuccess={() => {
              setIsCreateOpen(false);
              mutate();
            }}
            initialData={{ data: { stage: defaultStage } }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
