"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@repo/ui/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({
  id,
  title,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-80 min-w-[320px] bg-muted/30 rounded-xl border border-transparent transition-colors",
        isOver && "bg-primary/5 border-primary/20",
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">
            {title}
          </h3>
          <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 px-3 pb-4">{children}</div>
    </div>
  );
}
