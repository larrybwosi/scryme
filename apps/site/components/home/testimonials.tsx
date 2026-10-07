"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Testimonials({ testimonials }: { testimonials?: Array<{ quote: string; name: string; title: string; company: string; ticker: string; initials: string }> }) {
  const testimonialList = testimonials && testimonials.length > 0 ? testimonials : [
    {
      quote:
        "Scryme replaced four separate systems we were running. Our operations team now has a single dashboard for everything — inventory, POS, CRM, and finance. The ROI in the first quarter alone paid for the full-year subscription.",
      name: "Amara Diallo",
      title: "Chief Operating Officer",
      company: "Fontaine Group",
      ticker: "FTN",
      initials: "AD",
    },
    {
      quote:
        "We run 23 retail branches across three regions. Before Scryme, reconciling end-of-day sales was a half-day job. Now it takes minutes. The multi-branch inventory visibility alone is a game changer.",
      name: "Marcus Chen",
      title: "Head of Retail Operations",
      company: "Westfield Retail Holdings",
      ticker: "WRH",
      initials: "MC",
    },
    {
      quote:
        "The CRM pipeline gave our sales team a new level of accountability. We went from guessing what was in the pipeline to having real-time data on every deal. Deal velocity improved 40% in our first six months.",
      name: "Sophia Hargreaves",
      title: "VP of Sales",
      company: "Meridian Corp",
      ticker: "MRD",
      initials: "SH",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-muted/20 border-t border-border/80" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="On the Ledger"
          title="Trusted by High-Growth Retailers and Wholesalers"
          description="See how commerce operators rely on Scryme to streamline store operations, inventory management, and multi-channel scale."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonialList.map((t) => (
            <Card key={t.name} className="flex flex-col justify-between p-7">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-serif text-[var(--brass)] leading-none">&ldquo;</span>
                  <Badge variant="brass" size="sm">
                    {t.ticker}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {t.quote}
                </p>
              </div>

              <footer className="mt-6 pt-5 border-t border-border/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--brass-dim)] border border-[var(--brass-line)] text-[var(--brass)] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.title}, {t.company}</div>
                </div>
              </footer>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
