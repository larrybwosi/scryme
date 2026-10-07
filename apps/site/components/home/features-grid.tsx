"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { modules as defaultModules, type ModuleCode } from "@/lib/scryme-tokens";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

function ConnectsTo({ codes }: { codes: ModuleCode[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((c) => {
        const target = defaultModules.find((m) => m.code === c);
        return (
          <span
            key={c}
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
            style={{
              color: target?.accent || "var(--brass)",
              backgroundColor: `${target?.accent || "#C89A4B"}12`,
              borderColor: `${target?.accent || "#C89A4B"}33`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}

function ManifestRow({
  module,
  index,
}: {
  module: any;
  index: number;
}) {
  const imageUrl = module.image
    ? module.image.url || urlFor(module.image).width(400).height(250).url()
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: index * 0.05,
        duration: 0.45,
        ease: "easeOut",
      }}
      className="group grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-4 sm:gap-6 p-5 sm:px-6 sm:py-4 border-b border-border/60 transition-colors hover:bg-accent/40"
    >
      {/* Ticker code */}
      <div className="sm:col-span-1 flex items-center">
        <span
          className="text-xs font-mono font-bold tracking-wider px-2 py-1 rounded border"
          style={{
            color: module.accent,
            backgroundColor: `${module.accent}15`,
            borderColor: `${module.accent}30`,
          }}
        >
          {module.code}
        </span>
      </div>

      {/* Name */}
      <div className="sm:col-span-3">
        <h3 className="text-base font-bold text-foreground group-hover:text-[var(--brass)] transition-colors">
          {module.name}
        </h3>
      </div>

      {/* Description */}
      <div className="sm:col-span-4">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {module.description}
        </p>
      </div>

      {/* Image Preview Block */}
      <div className="hidden lg:block sm:col-span-2">
        <div className="relative h-12 w-24 overflow-hidden rounded-lg border border-border/80 bg-muted/40 shadow-xs">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={module.image?.alt || module.name}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
              Preview
            </div>
          )}
        </div>
      </div>

      {/* Connects to + link */}
      <div className="sm:col-span-2 flex flex-col items-start sm:items-end gap-2">
        <ConnectsTo codes={module.connectsTo || []} />
        <Link
          href={module.href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-[var(--brass)] transition-colors pt-1"
        >
          <span>Explore</span>
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

export function FeaturesGrid({ modules }: { modules?: any[] }) {
  const moduleList = modules && modules.length > 0 ? modules : defaultModules;

  return (
    <section id="features" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="Integrated Architecture"
          title="Six Core Modules. One Single Ledger."
          description="Every channel, shift, transaction, and inventory adjustment posts automatically to the central Scryme ledger. No batch delays, no missing stock."
          align="left"
        />

        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg">
          {/* Header Row */}
          <div className="hidden sm:grid grid-cols-12 gap-6 px-6 py-3 border-b border-border bg-muted/30 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span className="col-span-1">Code</span>
            <span className="col-span-3">Module Name</span>
            <span className="col-span-4">Platform Capability</span>
            <span className="hidden lg:block col-span-2">Preview</span>
            <span className="col-span-2 text-right">Interconnected</span>
          </div>

          {moduleList.map((module, index) => (
            <ManifestRow key={module.code} module={module} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
