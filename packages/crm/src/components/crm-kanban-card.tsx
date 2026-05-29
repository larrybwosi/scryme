'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@repo/ui/lib/utils';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Badge } from '@repo/ui/components/ui/badge';
import { Calendar, Building2, User, GripVertical } from 'lucide-react';

export interface DealCardData {
  id: string;
  name: string;
  value: number;
  stage: string;
  expectedCloseDate: string | null;
  probability: number;
  contactName: string | null;
  companyName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerAvatar: string | null;
}

interface CrmKanbanCardProps {
  deal: DealCardData;
  onClick?: () => void;
  isDragging?: boolean;
}

export function CrmKanbanCard({ deal, onClick, isDragging }: CrmKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOverdue = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:shadow-md hover:border-primary/20',
        'bg-card border-border/60',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg rotate-2 scale-105'
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-3" onClick={onClick}>
        {/* Header with drag handle and value */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm leading-tight truncate text-foreground">{deal.name}</h4>
              {deal.companyName && (
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs truncate">{deal.companyName}</span>
                </div>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            className="flex-shrink-0 font-semibold bg-primary/10 text-primary hover:bg-primary/15"
          >
            {formatCurrency(deal.value)}
          </Badge>
        </div>

        {/* Contact and date row */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 min-w-0">
            {deal.contactName && (
              <div className="flex items-center gap-1 min-w-0">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{deal.contactName}</span>
              </div>
            )}
            {deal.expectedCloseDate && (
              <div className={cn('flex items-center gap-1', isOverdue && 'text-destructive')}>
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{formatDate(deal.expectedCloseDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer with owner avatar and probability */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={deal.ownerAvatar || undefined} alt={deal.ownerName || 'Owner'} />
              <AvatarFallback className="text-[10px] bg-muted">{getInitials(deal.ownerName)}</AvatarFallback>
            </Avatar>
            {deal.ownerName && (
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{deal.ownerName}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium w-6 text-right">{deal.probability}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
