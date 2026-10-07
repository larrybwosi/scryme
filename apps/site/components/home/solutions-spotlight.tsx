"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { urlFor } from "@/sanity/lib/image";

interface SolutionsSpotlightProps {
  data: {
    storefrontTitle?: string;
    storefrontSubtitle?: string;
    storefrontImage?: any;
    multiBranchTitle?: string;
    multiBranchSubtitle?: string;
    multiBranchImage?: any;
    cmsTitle?: string;
    cmsSubtitle?: string;
    cmsImage?: any;
  };
}

export function SolutionsSpotlight({ data }: SolutionsSpotlightProps) {
  const sfTitle = data.storefrontTitle || "Automated Storefront Websites";
  const sfSubtitle = data.storefrontSubtitle || "Instantly build, customize, and manage customer-facing storefront websites for your brand. Beautiful e-commerce templates synchronized natively with your central stock database and retail POS registers.";
  const sfImgUrl = data.storefrontImage ? (data.storefrontImage.url || urlFor(data.storefrontImage).width(800).height(500).url()) : "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80";

  const mbTitle = data.multiBranchTitle || "Unified Multi-Branch Orchestration";
  const mbSubtitle = data.multiBranchSubtitle || "Scale across several branches with ease. Oversee location-specific pricing, staff shift rosters, live drawer reconciliations, and inter-branch inventory transfers from a unified cloud console.";
  const mbImgUrl = data.multiBranchImage ? (data.multiBranchImage.url || urlFor(data.multiBranchImage).width(800).height(500).url()) : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80";

  const cmsTitle = data.cmsTitle || "Customizable Storefront CMS & SEO";
  const cmsSubtitle = data.cmsSubtitle || "Take complete control of your digital storefront. Customize layouts, optimize meta tags, manage SEO settings, and publish content seamlessly with built-in enterprise CMS tools.";
  const cmsImgUrl = data.cmsImage ? (data.cmsImage.url || urlFor(data.cmsImage).width(800).height(500).url()) : "https://images.unsplash.com/photo-1542744095-2a483a7b9fd8?auto=format&fit=crop&w=800&q=80";

  const items = [
    { title: sfTitle, subtitle: sfSubtitle, imgUrl: sfImgUrl, label: "E-Commerce" },
    { title: mbTitle, subtitle: mbSubtitle, imgUrl: mbImgUrl, label: "Multi-Location" },
    { title: cmsTitle, subtitle: cmsSubtitle, imgUrl: cmsImgUrl, label: "Content CMS" },
  ];

  return (
    <section
      className="py-20 lg:py-28 bg-background border-t border-border/80"
      aria-labelledby="solutions-spotlight-heading"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="Growth Engine"
          title="Engineered for High Performance and Scale"
          description="Empower your operational teams and customers with automated e-commerce storefronts, multi-branch syncing, and built-in CMS controls."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <Card className="h-full flex flex-col justify-between group p-6">
                <div>
                  <div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden border border-border/80 shadow-xs">
                    <Image
                      src={item.imgUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="brass" size="sm">
                        {item.label}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-[var(--brass)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
