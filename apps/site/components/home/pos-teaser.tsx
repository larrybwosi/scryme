"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { urlFor } from "@/sanity/lib/image";

const highlights = [
  "True offline-first architecture — never stop ringing up sales during outages",
  "Real-time multi-branch stock levels update globally with every checkout",
  "Integrated barcode scanning and rapid payment-handling workflows",
  "Accept cash, cards, mobile payments, and split multi-tender tickets",
  "Automatic synchronization to Central Management ERP when registers reconcile",
];

interface POSTeaserProps {
  data: {
    posTeaserTitle?: string;
    posTeaserSubtitle?: string;
    posTeaserImage?: any;
  };
}

export function POSTeaser({ data }: POSTeaserProps) {
  const title = data.posTeaserTitle || "An integrated POS system built for high-performance retail";
  const subtitle = data.posTeaserSubtitle || "Whether you manage a single warehouse store, or scale several branches across various regions, every purchase made offline or online updates your stock levels instantly. Zero lag, zero human error, maximum operational speed.";
  const imgUrl = data.posTeaserImage
    ? (data.posTeaserImage.url || urlFor(data.posTeaserImage).width(800).height(500).url())
    : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80";

  return (
    <section className="py-20 lg:py-28 bg-background border-t border-border/80" aria-labelledby="pos-teaser-heading">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16">
          <div className="lg:col-span-6 w-full lg:order-1 order-2">
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

          <div className="lg:col-span-6 flex flex-col items-start space-y-6 lg:order-2 order-1">
            <Badge variant="brass" size="md">
              Offline-First POS Engine
            </Badge>

            <h2
              id="pos-teaser-heading"
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
              <Button href="/products/pos" variant="primary" size="lg" icon={<ArrowRight size={16} />}>
                Explore Integrated POS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
