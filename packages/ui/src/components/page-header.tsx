"use client";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  className,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start space-x-4 ${className}`}>
      {icon && (
        <div className="mt-1 text-primary dark:text-primary/90">{icon}</div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
