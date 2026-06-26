"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, DollarSign, Building2, User, GripVertical, ArrowUpRight } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import Link from 'next/link';
import type { StageConfig } from './kanban-column';

interface KanbanCardProps {
  deal: any;
  isOverlay?: boolean;
  stageConfig: StageConfig;
}

export function KanbanCard({ deal, isOverlay, stageConfig }: KanbanCardProps) {
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
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(deal.data.amount)
    : null;

  const closeDate = deal.data.expectedCloseDate
    ? new Date(deal.data.expectedCloseDate)
    : null;

  const closeDateFormatted = closeDate ? format(closeDate, 'MMM d') : null;
  const isOverdue = closeDate && isPast(closeDate) && deal.data.stage !== 'closed_won' && deal.data.stage !== 'closed_lost';
  const isDueSoon = closeDate && !isOverdue && differenceInDays(closeDate, new Date()) <= 7;

  const associatedCompany = deal.targetAssociations?.find((a: any) =>
    a.sourceRecord?.businessAccount
  )?.sourceRecord?.businessAccount;

  const associatedContact = deal.targetAssociations?.find((a: any) =>
    a.sourceRecord?.customer
  )?.sourceRecord?.customer;

  const associationName = associatedCompany?.name || associatedContact?.name;
  const AssociationIcon = associatedCompany ? Building2 : User;

  const initials = deal.data.name
    ? deal.data.name
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group outline-none mb-2',
        isDragging && 'opacity-40'
      )}
      {...attributes}
    >
      <div
        className={cn(
          'bg-card border border-border rounded-lg transition-all duration-150 overflow-hidden',
          'hover:border-border/80 hover:shadow-md',
          isOverlay && 'shadow-xl border-primary/40 rotate-[1.5deg] scale-[1.02]'
        )}
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: stageConfig.color,
        }}
      >
        {/* Drag handle + title row */}
        <div className="flex items-start gap-2 px-3 pt-3 pb-2">
          <button
            {...listeners}
            className="mt-0.5 p-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0 focus:outline-none"
            aria-label="Drag to reorder"
          >
            <GripVertical size={13} />
          </button>
          <div className="flex-1 min-w-0">
            <Link
              href={`/pipeline/${deal.id}`}
              className="block group/link"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-[12.5px] font-semibold text-foreground leading-snug group-hover/link:text-primary transition-colors line-clamp-2">
                {deal.data.name}
              </h4>
            </Link>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-3 pb-3 space-y-1.5">
          {/* Amount */}
          {amount && (
            <div className="flex items-center gap-1.5">
              <DollarSign size={11} className="text-muted-foreground/60 flex-shrink-0" />
              <span className="text-[12px] font-semibold text-foreground/90">{amount}</span>
              {deal.data.probability > 0 && (
                <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {deal.data.probability}%
                </span>
              )}
            </div>
          )}

          {/* Association */}
          {associationName && (
            <div className="flex items-center gap-1.5">
              <AssociationIcon size={11} className="text-muted-foreground/60 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground/80 truncate">{associationName}</span>
            </div>
          )}

          {/* Footer: date + avatar */}
          {(closeDateFormatted || true) && (
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/50">
              {closeDateFormatted ? (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    isOverdue && 'text-destructive',
                    isDueSoon && !isOverdue && 'text-amber-500 dark:text-amber-400',
                    !isOverdue && !isDueSoon && 'text-muted-foreground/60'
                  )}
                >
                  <Calendar size={10} />
                  <span className="text-[10.5px] font-medium">{closeDateFormatted}</span>
                  {isOverdue && <span className="text-[9px] font-bold uppercase tracking-wide">&bull; Overdue</span>}
                </div>
              ) : (
                <span />
              )}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: stageConfig.color }}
              >
                {initials}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
