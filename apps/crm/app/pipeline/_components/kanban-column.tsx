"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@repo/ui/lib/utils';
import { Plus } from 'lucide-react';

export interface StageConfig {
  id: string;
  title: string;
  color: string;          // Tailwind bg class for dot + accent
  headerColor: string;    // Tailwind text class
  borderClass: string;    // Left border when active/over
  dotClass: string;       // Color dot
}

export const STAGE_CONFIGS: StageConfig[] = [
  {
    id: 'discovery',
    title: 'Discovery',
    color: '#6366f1',
    headerColor: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-l-indigo-500',
    dotClass: 'bg-indigo-500',
  },
  {
    id: 'qualification',
    title: 'Qualification',
    color: '#3b82f6',
    headerColor: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-l-blue-500',
    dotClass: 'bg-blue-500',
  },
  {
    id: 'proposal',
    title: 'Proposal',
    color: '#8b5cf6',
    headerColor: 'text-violet-600 dark:text-violet-400',
    borderClass: 'border-l-violet-500',
    dotClass: 'bg-violet-500',
  },
  {
    id: 'negotiation',
    title: 'Negotiation',
    color: '#f59e0b',
    headerColor: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-l-amber-500',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'closed_won',
    title: 'Closed Won',
    color: '#22c55e',
    headerColor: 'text-green-600 dark:text-green-400',
    borderClass: 'border-l-green-500',
    dotClass: 'bg-green-500',
  },
  {
    id: 'closed_lost',
    title: 'Closed Lost',
    color: '#ef4444',
    headerColor: 'text-red-500 dark:text-red-400',
    borderClass: 'border-l-red-500',
    dotClass: 'bg-red-500',
  },
];

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  totalValue?: number;
  children: React.ReactNode;
  onAddDeal?: () => void;
  stageConfig: StageConfig;
}

export function KanbanColumn({
  id,
  title,
  count,
  totalValue,
  children,
  onAddDeal,
  stageConfig,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const formattedValue = totalValue
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(totalValue)
    : null;

  return (
    <div
      className={cn(
        'flex flex-col w-[272px] min-w-[272px] rounded-xl border transition-all duration-150',
        isOver
          ? 'border-primary/40 bg-primary/5 shadow-sm shadow-primary/10'
          : 'border-border bg-muted/30'
      )}
    >
      {/* Column Header */}
      <div className="px-3.5 pt-3.5 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: stageConfig.color }}
          />
          <h3 className="text-[12.5px] font-semibold text-foreground truncate">
            {title}
          </h3>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {formattedValue && (
            <span className="text-[11px] font-medium text-muted-foreground/70 mr-1">
              {formattedValue}
            </span>
          )}
          {onAddDeal && (
            <button
              onClick={onAddDeal}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label={`Add deal to ${title}`}
            >
              <Plus size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Thin color accent line */}
      <div
        className="h-[2px] mx-3.5 mb-3 rounded-full opacity-60"
        style={{ backgroundColor: stageConfig.color }}
      />

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 px-2.5 pb-2.5 min-h-[120px] transition-all duration-150 rounded-b-xl',
          isOver && 'kanban-drop-target'
        )}
      >
        {count === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center h-full min-h-[80px] border-2 border-dashed border-border/50 rounded-lg text-center p-4 mt-1">
            <p className="text-[11px] text-muted-foreground/60">Drop deals here</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
