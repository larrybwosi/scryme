import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { colors, fonts, modules } from "@/lib/scryme-tokens";
import { urlFor } from "@/sanity/lib/image";

const accent = modules.find((m) => m.code === "CRM")!.accent;

const highlights = [
  "Stunning consumer-facing storefront websites built instantly",
  "Real-time catalog, pricing, and stock sync with your central database",
  "Integrated CRM to capture customer emails and purchase histories",
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
    <section
      className="py-24"
      style={{ background: colors.inkPanelAlt }}
      aria-labelledby="crm-teaser-heading"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text left */}
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
                Storefronts & CRM
              </span>
            </div>
            <h2
              id="crm-teaser-heading"
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
              href="/products/crm"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: accent,
                color: colors.inkBg,
                fontFamily: fonts.body,
              }}
            >
              Explore Storefronts & CRM
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Sanity-managed Image right */}
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
