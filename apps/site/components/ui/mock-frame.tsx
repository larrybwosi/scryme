"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MockFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: "dark" | "light" | "glass";
  children: React.ReactNode;
}

export function MockFrame({
  title = "Scryme Operating System",
  variant = "dark",
  className,
  children,
  ...props
}: MockFrameProps) {
  const variantStyles = {
    dark: "bg-[var(--site-dark-surface)] border-[var(--site-dark-border)] text-white",
    light: "bg-card border-border text-foreground",
    glass: "glass-panel border-border/60 text-foreground",
  };

  return (
    <div
      className={cn(
        "rounded-xl border shadow-xl overflow-hidden flex flex-col transition-all duration-300",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* Window Header */}
      <div className="px-4 py-2.5 border-b border-inherit/40 flex items-center justify-between bg-black/10 shrink-0 select-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
        </div>
        <div className="text-[11px] font-mono opacity-60 tracking-wider truncate max-w-[200px] text-center">
          {title}
        </div>
        <div className="w-12" /> {/* Spacer balance */}
      </div>

      {/* Window Content */}
      <div className="p-4 md:p-6 overflow-x-auto relative">
        {children}
      </div>
    </div>
  );
}
