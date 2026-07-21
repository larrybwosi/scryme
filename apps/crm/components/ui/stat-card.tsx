import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border px-4 py-4 flex items-start justify-between gap-3 hover:shadow-sm transition-shadow',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.07em] truncate">
          {title}
        </p>
        <p className="text-[22px] font-bold text-foreground leading-tight mt-1.5 tabular-nums">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={cn(
                'text-[11px] font-semibold flex items-center gap-0.5',
                trend.positive ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}
            >
              {trend.positive ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {trend.value}
            </span>
          )}
          {sub && (
            <span className="text-[11px] text-muted-foreground truncate">{sub}</span>
          )}
        </div>
      </div>
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          iconBg
        )}
      >
        <Icon size={17} className={iconColor} />
      </div>
    </div>
  );
}
