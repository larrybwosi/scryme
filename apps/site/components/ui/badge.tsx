"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "brass" | "outline" | "success";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Badge({
  variant = "brass",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 font-mono uppercase tracking-wider transition-colors border select-none";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] rounded-full",
    md: "px-3 py-1 text-xs rounded-full",
  };

  const variantStyles = {
    brass:
      "bg-[var(--brass-dim)] text-[var(--brass)] border-[var(--brass-line)] shadow-xs",
    primary:
      "bg-primary/10 text-primary border-primary/20 shadow-xs",
    secondary:
      "bg-secondary text-secondary-foreground border-border/60",
    outline:
      "bg-background/80 text-foreground/80 border-border hover:border-foreground/30",
    success:
      "bg-[var(--ledger-green)]/10 text-[var(--ledger-green)] border-[var(--ledger-green)]/30",
  };

  return (
    <div
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children}
    </div>
  );
}
