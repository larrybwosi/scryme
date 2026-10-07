"use client";

import React, { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface FeatureSectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: { text: string }[];
  children: ReactNode;
  reverse?: boolean;
  dark?: boolean;
}

export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  bullets,
  children,
  reverse = false,
  dark = false,
}: FeatureSectionProps) {
  return (
    <section
      id={id}
      className={`py-20 lg:py-28 border-b border-border/80 ${
        dark ? "bg-muted/30" : "bg-background"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16 ${
            reverse ? "lg:flex-row-reverse" : ""
          }`}
        >
          <div
            className={`lg:col-span-5 flex flex-col items-start space-y-6 ${
              reverse ? "lg:order-2" : "lg:order-1"
            }`}
          >
            <Badge variant="brass" size="md">
              {eyebrow}
            </Badge>

            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
              {title}
            </h3>

            <p className="text-base text-muted-foreground leading-relaxed">
              {description}
            </p>

            <ul className="space-y-3 pt-2 w-full">
              {bullets.map((b) => (
                <li
                  key={b.text}
                  className="flex items-start gap-3 text-xs sm:text-sm text-foreground"
                >
                  <CheckCircle2 size={16} className="text-[var(--brass)] shrink-0 mt-0.5" />
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`lg:col-span-7 w-full ${
              reverse ? "lg:order-1" : "lg:order-2"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
