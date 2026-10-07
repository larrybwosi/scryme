"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { captureCtaClicked } from "@/lib/posthog-tracking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  href: string;
  highlight: boolean;
  badge?: string;
  features: (string | null)[];
}

export function PricingPlans({ plans }: { plans: Plan[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            variant={plan.highlight ? "brass" : "default"}
            className={`relative flex flex-col justify-between p-8 border-2 ${
              plan.highlight
                ? "border-[var(--brass)] shadow-xl scale-[1.02]"
                : "border-border/80"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge variant="brass" size="sm">
                  {plan.badge.toUpperCase()}
                </Badge>
              </div>
            )}

            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--brass)] mb-3">
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground font-mono">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {plan.tagline}
              </p>

              <Button
                variant={plan.highlight ? "brass" : "primary"}
                size="lg"
                href={plan.href}
                className="w-full mb-6"
                icon={plan.highlight ? <ArrowRight size={16} /> : undefined}
                onClick={() =>
                  captureCtaClicked("pricing_plan_cta_clicked", {
                    location: "pricing_grid",
                    cta_label: plan.cta,
                    destination: plan.href,
                    cta_type: "plan",
                    plan_name: plan.name,
                  })
                }
              >
                {plan.cta}
              </Button>

              <div className="pt-6 border-t border-border/60">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Included Features
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feat, i) =>
                    feat ? (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                        <CheckCircle2 size={16} className="text-[var(--brass)] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ) : (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground/50 line-through">
                        <X size={16} className="text-muted-foreground/40 shrink-0 mt-0.5" />
                        <span>Feature omitted</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
