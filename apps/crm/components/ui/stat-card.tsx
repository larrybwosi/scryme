import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

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
        'bg-card rounded-xl border border-border px-5 py-4 flex items-start justify-between gap-4',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className="text-[26px] font-bold text-foreground leading-tight mt-1">{value}</p>
        {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                'text-[11.5px] font-semibold',
                trend.positive ? 'text-status-success' : 'text-destructive'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-[11px] text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>
    </div>
  );
}
