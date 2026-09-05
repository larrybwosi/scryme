"use client";

import { PosDownloadSection } from "@/components/products/pos/pos-download-section";
import { colors, fonts } from "@/lib/scryme-tokens";

export function DownloadPageClient() {
  return (
    <main className="min-h-screen bg-[#0B1220] pt-20">
      <div className="mx-auto max-w-4xl px-6 pt-12 pb-6 text-center">
        <h1
          className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4"
          style={{ fontFamily: fonts.display }}
        >
          Download Scryme POS Apps
        </h1>
        <p
          className="text-base sm:text-lg max-w-2xl mx-auto"
          style={{ color: colors.textMuted, fontFamily: fonts.body }}
        >
          Choose the specialized variant tailored for your store or venue. Downloads are native builds optimized for speed, peripheral connectivity, and offline operation.
        </p>
      </div>

      <PosDownloadSection />
    </main>
  );
}
