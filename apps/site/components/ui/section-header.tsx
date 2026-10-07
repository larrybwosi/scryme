"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  badgeVariant?: "primary" | "secondary" | "brass" | "outline" | "success";
  title: string;
  description?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  badgeVariant = "brass",
  title,
  description,
  align = "center",
  size = "md",
  className,
}: SectionHeaderProps) {
  const alignStyles = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  const titleSizes = {
    sm: "text-2xl md:text-3xl font-bold tracking-tight",
    md: "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight",
    lg: "text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "flex flex-col max-w-3xl mb-12 md:mb-16",
        alignStyles[align],
        className
      )}
    >
      {eyebrow && (
        <Badge variant={badgeVariant} className="mb-4">
          {eyebrow}
        </Badge>
      )}
      <h2 className={cn(titleSizes[size], "text-foreground leading-[1.15]")}>
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl text-pretty">
          {description}
        </p>
      )}
    </motion.div>
  );
}
