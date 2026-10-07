"use client";

import React, { type ReactNode } from "react";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Cta {
  label: string;
  href: string;
}

interface ProductHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  module: string;
  visual?: ReactNode;
}

export function ProductHero({
  eyebrow,
  title,
  description,
  primaryCta = { label: "Start free trial", href: "#" },
  secondaryCta,
  module,
  visual,
}: ProductHeroProps) {
  return (
    <header className="relative overflow-hidden bg-background pt-28 pb-16 sm:pt-36 sm:pb-20 border-b border-border/80">
      <div className="enterprise-grid absolute inset-0 pointer-events-none opacity-30" />

      <div
        className={`relative container mx-auto px-4 lg:px-8 ${
          visual
            ? "grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16"
            : "max-w-3xl mx-auto text-center"
        }`}
      >
        <div className={visual ? "lg:col-span-6 flex flex-col items-start space-y-6" : "flex flex-col items-center space-y-6"}>
          <Badge variant="brass" size="md">
            {eyebrow}
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] text-balance">
            {title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              variant="brass"
              size="lg"
              href={primaryCta.href}
              icon={<ArrowRight size={16} />}
              onClick={() =>
                captureCtaClicked("product_hero_cta_clicked", {
                  location: "product_hero",
                  cta_label: primaryCta.label,
                  destination: primaryCta.href,
                  cta_type: "primary",
                  module,
                })
              }
            >
              {primaryCta.label}
            </Button>

            {secondaryCta && (
              <Button
                variant="outline"
                size="lg"
                href={secondaryCta.href}
                onClick={() =>
                  captureCtaClicked("product_hero_cta_clicked", {
                    location: "product_hero",
                    cta_label: secondaryCta.label,
                    destination: secondaryCta.href,
                    cta_type: "secondary",
                    module,
                  })
                }
              >
                {secondaryCta.label}
              </Button>
            )}
          </div>
        </div>

        {visual && <div className="lg:col-span-6 w-full">{visual}</div>}
      </div>
    </header>
  );
}
