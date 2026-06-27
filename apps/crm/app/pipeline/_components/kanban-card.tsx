"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { Calendar, DollarSign, Building2, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface KanbanCardProps {
  deal: any;
  isOverlay?: boolean;
}

export function KanbanCard({ deal, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const amount = deal.data.amount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(deal.data.amount)
    : "—";

  const expectedCloseDate = deal.data.expectedCloseDate
    ? format(new Date(deal.data.expectedCloseDate), "MMM d, yyyy")
    : null;

  const associatedCompany = deal.targetAssociations?.find(
    (a: any) => a.sourceRecord?.businessAccount,
  )?.sourceRecord?.businessAccount;

  const associatedContact = deal.targetAssociations?.find(
    (a: any) => a.sourceRecord?.customer,
  )?.sourceRecord?.customer;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group outline-none", isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
    >
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing border-border/50 hover:border-primary/30 transition-all",
          isOverlay && "shadow-xl border-primary scale-[1.02]",
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-1">
            <Link href={`/pipeline/${deal.id}`} className="hover:underline">
              <h4 className="text-[13.5px] font-semibold text-foreground group-hover:text-primary transition-colors">
                {deal.data.name}
              </h4>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign size={13} className="text-primary/70" />
              <span className="text-[12.5px] font-medium text-foreground">
                {amount}
              </span>
            </div>

            {associatedCompany ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 size={13} />
                <span className="text-[11.5px] truncate text-foreground font-medium">
                  {associatedCompany.name}
                </span>
              </div>
            ) : associatedContact ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User size={13} />
                <span className="text-[11.5px] truncate text-foreground font-medium">
                  {associatedContact.name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 size={13} />
                <span className="text-[11.5px] truncate">No Association</span>
              </div>
            )}
          </div>

          {expectedCloseDate && (
            <div className="pt-2 border-t border-border/40 flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={12} />
              <span className="text-[11px]">{expectedCloseDate}</span>
              {deal.data.probability && (
                <span className="ml-auto bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {deal.data.probability}%
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
