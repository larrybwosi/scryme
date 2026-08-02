import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { colors, fonts, modules } from "@/lib/scryme-tokens";
import { urlFor } from "@/sanity/lib/image";

const accent = modules.find((m) => m.code === "POS")!.accent;

const highlights = [
  "True offline-first architecture — never stop ringing up sales",
  "Real-time multi-branch stock levels update globally with every checkout",
  "Integrated barcode scanning and rapid payment-handling workflows",
  "Accept cash, cards, mobile payments, and split multi-tender tickets",
  "Automatic synchronization to Central Management ERP the second cash drawers reconcile",
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
    <section
      className="py-24"
      style={{ background: colors.inkBg }}
      aria-labelledby="pos-teaser-heading"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          {/* Text right */}
          <div className="flex-1 max-w-lg">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: `${accent}1A`,
                border: `1px solid ${accent}55`,
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: accent, fontFamily: fonts.mono }}
              >
                POS
              </span>
            </div>
            <h2
              id="pos-teaser-heading"
              className="text-3xl sm:text-4xl font-medium text-balance"
              style={{ color: colors.textPrimary, fontFamily: fonts.display }}
            >
              {title}
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: colors.textMuted, fontFamily: fonts.body }}
            >
              {subtitle}
            </p>

            <ul className="mt-7 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: accent }}
                  />
                  <span
                    className="text-sm"
                    style={{
                      color: colors.textPrimary,
                      fontFamily: fonts.body,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/products/pos"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: accent,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
            >
              Explore Integrated POS
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Sanity-managed Image left */}
          <div className="flex-1 w-full max-w-xl">
            <div
              className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden border"
              style={{ borderColor: colors.inkLine }}
            >
              <Image
                src={imgUrl}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
