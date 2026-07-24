"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { colors, fonts, modules as defaultModules, type ModuleCode } from "@/lib/scryme-tokens";
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
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              fontFamily: fonts.mono,
              color: target?.accent,
              background: `${target?.accent}1A`,
              border: `1px solid ${target?.accent}33`,
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
  const imageUrl = module.image ? (module.image.url || urlFor(module.image).width(400).height(250).url()) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: index * 0.06,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group grid grid-cols-1 sm:grid-cols-[88px_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1.4fr)_140px] items-start sm:items-center gap-3 sm:gap-6 px-5 py-5 sm:py-4 border-b transition-colors hover:bg-[var(--hover-bg)]"
      style={{ borderColor: colors.inkLine }}
    >
      {/* Ticker code */}
      <div className="flex items-center gap-2 sm:block">
        <span
          className="text-sm font-semibold tracking-wider inline-block px-2 py-1 rounded"
          style={{
            fontFamily: fonts.mono,
            color: module.accent,
            background: `${module.accent}17`,
          }}
        >
          {module.code}
        </span>
      </div>

      {/* Name */}
      <h3
        className="text-base sm:text-lg font-medium leading-snug"
        style={{ color: colors.textPrimary, fontFamily: fonts.display }}
      >
        {module.name}
      </h3>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: colors.textMuted, fontFamily: fonts.body }}
      >
        {module.description}
      </p>

      {/* Image Preview Block */}
      <div className="relative hidden md:block h-14 w-24 overflow-hidden rounded border"
        style={{ borderColor: colors.inkLine, background: colors.inkPanel }}
      >
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
          <div className="flex items-center justify-center h-full w-full bg-slate-900/40 text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Preview
          </div>
        )}
      </div>

      {/* Connects to + link */}
      <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-2">
        <ConnectsTo codes={module.connectsTo} />
        <Link
          href={module.href}
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors opacity-70 group-hover:opacity-100"
          style={{ color: colors.textPrimary, fontFamily: fonts.body }}
          aria-label={`Learn more about ${module.name}`}
        >
          Learn more
          <ArrowRight
            size={12}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </motion.article>
  );
}

export function FeaturesGrid({ modules }: { modules?: any[] }) {
  const moduleList = modules && modules.length > 0 ? modules : defaultModules;

  return (
    <section
      id="features"
      className="py-24"
      style={{ background: colors.inkBg }}
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12"
        >
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
          >
            The manifest
          </span>
          <h2
            id="features-heading"
            className="mt-3 text-3xl sm:text-4xl font-medium text-balance leading-tight"
            style={{ color: colors.textPrimary, fontFamily: fonts.display }}
          >
            Six modules. One ledger underneath.
          </h2>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            Nothing here runs in isolation. Every module posts to the same
            record, so the &quot;connects to&quot; column isn&apos;t marketing — it&apos;s what
            actually happens when an entry is made.
          </p>
        </motion.div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.inkPanelAlt,
            border: `1px solid ${colors.inkLine}`,
          }}
        >
          {/* header row — desktop only */}
          <div
            className="hidden sm:grid grid-cols-[88px_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1.4fr)_140px] gap-6 px-5 py-3 border-b"
            style={{ borderColor: colors.inkLine }}
          >
            {["Code", "Module", "What it does", "Preview", "Connects to"].map((h) => (
              <span
                key={h}
                className="text-[10px] uppercase tracking-widest"
                style={{ color: colors.textFaint, fontFamily: fonts.mono }}
              >
                {h}
              </span>
            ))}
          </div>

          {moduleList.map((module, index) => (
            <ManifestRow key={module.code} module={module} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
