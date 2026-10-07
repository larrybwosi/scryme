"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
  variant?: "default" | "dark" | "brass" | "glass";
  children: React.ReactNode;
}

export function Card({
  hoverEffect = true,
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-card text-card-foreground border border-border/80 shadow-xs",
    dark: "bg-[var(--site-dark-card)] text-white border border-[var(--site-dark-border)] shadow-md",
    brass: "bg-[var(--brass-dim)] border border-[var(--brass-line)] text-foreground shadow-xs",
    glass: "glass-panel border border-border/50 text-foreground shadow-sm",
  };

  return (
    <motion.div
      whileHover={
        hoverEffect
          ? {
              y: -3,
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      className={cn(
        "relative rounded-xl p-6 transition-colors duration-200 overflow-hidden",
        variantStyles[variant],
        hoverEffect && "hover:border-foreground/20 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-4 border-t border-border/40 mt-6", className)}
      {...props}
    />
  );
}
