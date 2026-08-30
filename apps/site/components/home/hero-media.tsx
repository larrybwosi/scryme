"use client";

import Image from "next/image";
import { Activity, BarChart3, Boxes, Radio } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";

export interface HeroMediaData {
  image?: { asset?: { _ref: string; _type: "reference" }; url?: string; alt?: string };
  video?: { url?: string; mimeType?: string; poster?: { asset?: { _ref: string; _type: "reference" }; url?: string; alt?: string }; ariaLabel?: string };
}

const activity = [
  ["POS-1042", "Westfield / Register 03", "+ $4,320.00", "Synced"],
  ["INV-883", "Central warehouse", "214 units", "In transit"],
  ["WEB-291", "Meridian storefront", "+ $1,840.00", "Captured"],
  ["FIN-771", "Daily close", "$48,290.00", "Reconciled"],
];

export function HeroMedia({ image, video }: HeroMediaData) {
  const imageUrl = image ? image.url || urlFor(image).width(1400).height(900).url() : undefined;
  const posterUrl = video?.poster ? video.poster.url || urlFor(video.poster).width(1400).height(900).url() : imageUrl;

  return (
    <div className="premium-frame relative overflow-hidden rounded-xl border border-inkLine bg-inkPanelAlt p-2 shadow-2xl sm:p-3">
      {video?.url ? (
        <video className="aspect-[16/10] w-full rounded-lg object-cover" src={video.url} poster={posterUrl} muted autoPlay loop playsInline preload="metadata" aria-label={video.ariaLabel || "Scryme platform overview"} />
      ) : imageUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg"><Image src={imageUrl} alt={image?.alt || "Scryme commerce operations platform"} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /></div>
      ) : (
        <div className="aspect-[16/10] overflow-hidden rounded-lg border border-inkLine bg-inkBg p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-inkLine pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-textFaint">Command center</p><p className="mt-1 font-sans text-sm font-semibold text-textPrimary">Global operations</p></div><span className="flex items-center gap-2 rounded-full bg-brassDim px-3 py-1 font-mono text-[10px] text-brass"><Radio aria-hidden="true" /> Live</span></div>
          <div className="grid gap-3 py-4 sm:grid-cols-3">
            {[{ icon: BarChart3, label: "Net revenue", value: "$341.8k" }, { icon: Boxes, label: "Stock health", value: "97.4%" }, { icon: Activity, label: "Sync latency", value: "86ms" }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-md border border-inkLine bg-inkPanel p-3"><Icon className="text-brass" aria-hidden="true" /><p className="mt-4 font-mono text-[9px] uppercase tracking-wider text-textFaint">{label}</p><p className="mt-1 font-mono text-base font-semibold text-textPrimary">{value}</p></div>)}
          </div>
          <div className="overflow-hidden rounded-md border border-inkLine"><div className="grid grid-cols-[0.8fr_1.6fr_1fr_1fr] bg-inkPanel px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-textFaint"><span>Entry</span><span>Source</span><span>Value</span><span>Status</span></div>{activity.map((row) => <div key={row[0]} className="grid grid-cols-[0.8fr_1.6fr_1fr_1fr] border-t border-inkLine px-3 py-2.5 font-mono text-[10px] text-textMuted"><span className="text-brass">{row[0]}</span><span className="truncate">{row[1]}</span><span className="text-textPrimary">{row[2]}</span><span className="text-ledgerGreen">{row[3]}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
