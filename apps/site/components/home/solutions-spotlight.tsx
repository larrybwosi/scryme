"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { colors, fonts } from "@/lib/scryme-tokens";
import { urlFor } from "@/sanity/lib/image";

interface SolutionsSpotlightProps {
  data: {
    storefrontTitle?: string;
    storefrontSubtitle?: string;
    storefrontImage?: any;
    multiBranchTitle?: string;
    multiBranchSubtitle?: string;
    multiBranchImage?: any;
    stockManagementTitle?: string;
    stockManagementSubtitle?: string;
    stockManagementImage?: any;
  };
}

export function SolutionsSpotlight({ data }: SolutionsSpotlightProps) {
  const sfTitle = data.storefrontTitle || "Customer-Facing Storefront Websites";
  const sfSubtitle = data.storefrontSubtitle || "Instantly build, customize, and manage customer-facing storefront websites for your brand. Beautiful e-commerce templates synchronized natively with your central stock database and retail POS registers.";
  const sfImgUrl = data.storefrontImage ? (data.storefrontImage.url || urlFor(data.storefrontImage).width(800).height(500).url()) : "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80";

  const mbTitle = data.multiBranchTitle || "Unified Multi-Branch Orchestration";
  const mbSubtitle = data.multiBranchSubtitle || "Scale across several branches with ease. Oversee location-specific pricing, staff shift rosters, live drawer reconciliations, and inter-branch inventory transfers from a unified cloud console.";
  const mbImgUrl = data.multiBranchImage ? (data.multiBranchImage.url || urlFor(data.multiBranchImage).width(800).height(500).url()) : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80";

  const smTitle = data.stockManagementTitle || "Advanced Stock & Inventory Control";
  const smSubtitle = data.stockManagementSubtitle || "Optimize cash flow with intelligent stock level monitoring. Prevent stockouts using multi-warehouse replenishment workflows and automated trigger thresholds synchronized with online and offline channels.";
  const smImgUrl = data.stockManagementImage ? (data.stockManagementImage.url || urlFor(data.stockManagementImage).width(800).height(500).url()) : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80";

  const items = [
    { title: sfTitle, subtitle: sfSubtitle, imgUrl: sfImgUrl, label: "Storefronts" },
    { title: mbTitle, subtitle: mbSubtitle, imgUrl: mbImgUrl, label: "Multi-Branch" },
    { title: smTitle, subtitle: smSubtitle, imgUrl: smImgUrl, label: "Stock & Inventory" },
  ];

  return (
    <section
      className="py-24 border-t border-b"
      style={{ background: colors.inkPanel, borderColor: colors.inkLine }}
      aria-labelledby="solutions-spotlight-heading"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: colors.brass, fontFamily: fonts.mono }}
          >
            Sanity-Managed Solutions
          </span>
          <h2
            id="solutions-spotlight-heading"
            className="mt-3 text-3xl sm:text-4xl font-medium text-balance"
            style={{ color: colors.textPrimary, fontFamily: fonts.display }}
          >
            Engineered for high performance and growth
          </h2>
          <p
            className="mt-4 text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: colors.textMuted, fontFamily: fonts.body }}
          >
            Empower your team and your clients with automated website builders, multi-branch tracking, and robust offline point-of-sale systems.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="rounded-2xl p-6 flex flex-col justify-between border"
              style={{ background: colors.inkBg, borderColor: colors.inkLine }}
            >
              <div>
                <div className="relative w-full h-[200px] mb-6 rounded-xl overflow-hidden border"
                  style={{ borderColor: colors.inkLine }}
                >
                  <Image
                    src={item.imgUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded bg-slate-900/80"
                    style={{ color: colors.brass, fontFamily: fonts.mono }}
                  >
                    {item.label}
                  </div>
                </div>

                <h3
                  className="text-xl font-medium mb-3"
                  style={{ color: colors.textPrimary, fontFamily: fonts.display }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: colors.textMuted, fontFamily: fonts.body }}
                >
                  {item.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
