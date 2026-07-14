import type { Metadata } from "next";
import { Globe, Users, TrendingUp, Award } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { Eyebrow } from "@/components/products/eyebrow";
import { AboutStats } from "@/components/about/about-stats";
import { AboutTimeline } from "@/components/about/about-timeline";
import { AboutValues } from "@/components/about/about-values";
import { AboutTeam } from "@/components/about/about-team";
import { PricingCTA } from "@/components/home/pricing-cta";

const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";

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

const stats = [
  { icon: Users, value: "4,200+", label: "Businesses on Scryme" },
  { icon: Globe, value: "18", label: "Countries" },
  { icon: TrendingUp, value: "$3.8M+", label: "Transactions daily" },
  { icon: Award, value: "4.9 / 5", label: "Customer satisfaction" },
];

const timeline = [
  {
    year: "2019",
    milestone:
      "Founded in Accra, Ghana. First POS beta shipped to 12 local retailers.",
  },
  {
    year: "2021",
    milestone:
      "Launched CRM and Inventory modules. Reached 500 businesses across West Africa.",
  },
  {
    year: "2022",
    milestone: "Series A funding. Expanded to UK and Southeast Asia markets.",
  },
  {
    year: "2023",
    milestone:
      "Launched Finance module and Tauri desktop POS. Crossed 2,000 customers.",
  },
  {
    year: "2025",
    milestone:
      "4,200+ businesses in 18 countries. $3.8M+ daily transactions processed.",
  },
];

const values = [
  {
    tag: "RF",
    title: "Reliability first",
    desc: "Our offline-first POS and 99.9% uptime commitment mean your business keeps running — no matter what the network does.",
  },
  {
    tag: "RO",
    title: "Built for real operations",
    desc: "Every feature in Scryme was informed by actual conversations with retailers and wholesalers, not theoretical user stories.",
  },
  {
    tag: "TP",
    title: "Transparent pricing",
    desc: "No hidden modules, no per-feature add-ons. The price you see is what you pay — features included as your business scales.",
  },
  {
    tag: "LP",
    title: "Long-term partnership",
    desc: "We measure success by our customers' revenue growth, not activation rates. Our team is reachable, accountable, and invested.",
  },
];

const team = [
  { name: "Adeola Mensah", role: "Chief Executive Officer", initials: "AM" },
  { name: "Yuki Tanaka", role: "Chief Product Officer", initials: "YT" },
  { name: "Samuel Osei", role: "Chief Technology Officer", initials: "SO" },
  { name: "Lena Hoffmann", role: "VP of Customer Success", initials: "LH" },
  { name: "Priya Rajan", role: "Head of Engineering", initials: "PR" },
  { name: "Marcus Webb", role: "Head of Sales", initials: "MW" },
];

export default function AboutPage() {
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
            The ERP built for businesses that can&apos;t afford to stop
          </h1>
          <p
            className="mx-auto max-w-2xl text-xl leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            We built Scryme after watching too many retailers lose hours every
            week reconciling spreadsheets, battling unreliable POS systems, and
            missing growth because their tools were designed for someone else.
            Scryme is different — purpose-built for the businesses that keep the
            economy moving.
          </p>
        </div>
      </section>

      <AboutStats stats={stats} />

      {/* Mission */}
      <section className="py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 lg:flex-row">
          <div className="flex-1">
            <Eyebrow>Our mission</Eyebrow>
            <h2
              className="mb-6 mt-4 text-[1.9rem] leading-[1.16] sm:text-4xl"
              style={{ fontFamily: fonts.display, color: colors.paper }}
            >
              Give every business the tools that used to require a Fortune 500
              budget
            </h2>
            <p
              className="mb-5 text-[15.5px] leading-relaxed"
              style={{ color: colors.textMuted }}
            >
              Enterprise ERP platforms have long been out of reach for
              independent retailers and mid-market wholesalers — priced in
              six-figure implementation fees and requiring dedicated IT
              departments to maintain.
            </p>
            <p
              className="text-[15.5px] leading-relaxed"
              style={{ color: colors.textMuted }}
            >
              Scryme changes that. We ship a unified platform — CRM, POS,
              Inventory, and Finance — that a 10-person team can run as
              confidently as a 10,000-person organisation. Our pricing is
              transparent, our onboarding is measured in days not months, and
              our support is staffed by people who understand retail and
              wholesale.
            </p>
          </div>
          <div className="w-full flex-1">
            <AboutTimeline entries={timeline} />
          </div>
        </div>
      </section>

      <AboutValues
        eyebrow="How we work"
        title="Principles we build around"
        values={values}
      />

      <AboutTeam
        eyebrow="Leadership"
        title="The team behind the platform"
        team={team}
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
