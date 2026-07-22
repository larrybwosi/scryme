import type { Metadata } from "next";
import { Globe, Users, TrendingUp, Award } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { AboutStats } from "@/components/about/about-stats";
import { AboutTimeline } from "@/components/about/about-timeline";
import { AboutValues } from "@/components/about/about-values";
import { AboutTeam } from "@/components/about/about-team";
import { PricingCTA } from "@/components/home/pricing-cta";
import { getAboutPageContent } from "../../lib/sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us — Our Mission to Empower Global Commerce",
  description:
    "Scryme was founded to give independent and growing businesses the same ERP capabilities that enterprise conglomerates take for granted. Learn about our story and leadership.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Scryme",
    description: "Learn about the mission and team behind the enterprise platform built for businesses that can't afford to stop.",
    url: "https://scryme.tech/about",
  },
};

export default async function AboutPage() {
  const content = await getAboutPageContent();

  const statIcons = [Users, Globe, TrendingUp, Award];
  const mappedStats = content.stats.map((stat, i) => ({
    ...stat,
    icon: statIcons[i % statIcons.length],
  }));

  return (
    <main style={{ background: colors.inkBg }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b pb-20 pt-32"
        style={{ borderColor: colors.inkLine }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `repeating-linear-gradient(180deg, ${colors.inkLine} 0px, ${colors.inkLine} 1px, transparent 1px, transparent 64px)`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Eyebrow center>Our story</Eyebrow>
          <h1
            className="mb-7 mt-5 text-[2.6rem] leading-[1.08] sm:text-6xl"
            style={{
              fontFamily: fonts.display,
              color: colors.paper,
              letterSpacing: "-0.01em",
            }}
          >
            {content.heroTitle}
          </h1>
          <p
            className="mx-auto max-w-2xl text-xl leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            {content.heroSubtitle}
          </p>
        </div>
      </section>

      <AboutStats stats={mappedStats} />

      {/* Mission */}
      <section className="py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            <div className="flex-1">
              <Eyebrow>Our mission</Eyebrow>
              <h2
                className="mb-6 mt-4 text-[1.9rem] leading-[1.16] sm:text-4xl"
                style={{ fontFamily: fonts.display, color: colors.paper }}
              >
                {content.missionTitle}
              </h2>
              {content.missionText.map((p, i) => (
                <p
                  key={i}
                  className={i === 0 ? "mb-5 text-[15.5px] leading-relaxed" : "text-[15.5px] leading-relaxed"}
                  style={{ color: colors.textMuted }}
                >
                  {p}
                </p>
              ))}
            </div>
            {content.missionImage && (
              <div className="w-full flex-1 relative h-[320px] sm:h-[400px] overflow-hidden rounded-xl border"
                style={{ borderColor: colors.brassLine, background: colors.inkPanel }}
              >
                <Image
                  src={content.missionImage.url || urlFor(content.missionImage).width(800).height(500).url()}
                  alt={content.missionImage.alt || "Scryme Mission and Corporate Team Strategy Planning"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                  priority
                />
              </div>
            )}
          </div>
          <div className="w-full border-t pt-16" style={{ borderColor: colors.inkLine }}>
            <div className="max-w-2xl">
              <Eyebrow>Milestones</Eyebrow>
              <h3
                className="mb-8 mt-4 text-2xl sm:text-3xl"
                style={{ fontFamily: fonts.display, color: colors.paper }}
              >
                Our Journey So Far
              </h3>
            </div>
            <AboutTimeline entries={content.timeline} />
          </div>
        </div>
      </section>

      <AboutValues
        eyebrow="How we work"
        title="Principles we build around"
        values={content.values}
      />

      <AboutTeam
        eyebrow="Leadership"
        title="The team behind the platform"
        team={content.team}
      />

      <PricingCTA
        title="Ready to see Scryme in action?"
        description="Book a 30-minute walkthrough with one of our product specialists. No slides — just a live demo tailored to your business."
        primaryCta={{ label: "Start free trial", href: "/pricing" }}
        secondaryCta={{ label: "Book a demo", href: "/contact" }}
      />
    </main>
  );
}
