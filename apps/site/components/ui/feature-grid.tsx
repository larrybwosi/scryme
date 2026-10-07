"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardTitle, CardDescription } from "./card";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  icon?: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  link?: {
    label: string;
    href: string;
  };
}

export interface FeatureGridProps {
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureGrid({
  items,
  columns = 3,
  className,
}: FeatureGridProps) {
  const colStyles = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className={cn("grid gap-6", colStyles[columns], className)}
    >
      {items.map((item, index) => (
        <motion.div key={index} variants={itemVariants}>
          <Card className="h-full flex flex-col justify-between group">
            <div>
              {item.icon && (
                <div className="w-10 h-10 rounded-lg bg-[var(--brass-dim)] border border-[var(--brass-line)] text-[var(--brass)] flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105">
                  {item.icon}
                </div>
              )}
              <CardTitle className="mb-2 text-base md:text-lg">
                {item.title}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {item.description}
              </CardDescription>
            </div>
            {item.link && (
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center text-xs font-semibold text-[var(--brass)] group-hover:underline">
                <span>{item.link.label}</span>
                <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
