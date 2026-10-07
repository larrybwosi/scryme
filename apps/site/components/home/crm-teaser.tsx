"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { urlFor } from "@/sanity/lib/image";

const highlights = [
  "Stunning consumer-facing storefront websites built instantly",
  "Real-time catalog, pricing, and stock sync with your central database",
  "Integrated CRM to capture customer profiles and purchase histories",
  "Flexible e-commerce layouts optimized for conversion and speed",
  "Every order posts directly to central inventory and billing ledgers",
];

interface CRMTeaserProps {
  data: {
    crmTeaserTitle?: string;
    crmTeaserSubtitle?: string;
    crmTeaserImage?: any;
  };
}

export function CRMTeaser({ data }: CRMTeaserProps) {
  const title = data.crmTeaserTitle || "Launch beautiful, high-converting customer storefronts";
  const subtitle = data.crmTeaserSubtitle || "Scryme enables you to create and manage stunning customer-facing storefront websites instantly. Build robust digital layouts for your clients, fully synchronized in real-time with your central stock levels, integrated POS registers, and consolidated customer data.";
  const imgUrl = data.crmTeaserImage
    ? (data.crmTeaserImage.url || urlFor(data.crmTeaserImage).width(800).height(500).url())
    : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";

  return (
    <section className="py-20 lg:py-28 bg-muted/30 border-t border-border/80" aria-labelledby="crm-teaser-heading">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16">
          <div className="lg:col-span-6 flex flex-col items-start space-y-6">
            <Badge variant="brass" size="md">
              Storefronts & CRM Suite
            </Badge>

            <h2
              id="crm-teaser-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.12]"
            >
              {title}
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed">
              {subtitle}
            </p>

            <ul className="space-y-3 pt-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-[var(--brass)] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button href="/products/crm" variant="brass" size="lg" icon={<ArrowRight size={16} />}>
                Explore Storefronts & CRM
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6 w-full">
            <div className="relative w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-border shadow-xl">
              <Image
                src={imgUrl}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
