import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, Users, TrendingUp, Award } from "lucide-react";

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

const values = [
  {
    title: "Reliability first",
    desc: "Our offline-first POS and 99.9% uptime commitment mean your business keeps running — no matter what the network does.",
  },
  {
    title: "Built for real operations",
    desc: "Every feature in Scryme was informed by actual conversations with retailers and wholesalers, not theoretical user stories.",
  },
  {
    title: "Transparent pricing",
    desc: "No hidden modules, no per-feature add-ons. The price you see is what you pay — features included as your business scales.",
  },
  {
    title: "Long-term partnership",
    desc: "We measure success by our customers' revenue growth, not activation rates. Our team is reachable, accountable, and invested.",
  },
];

const stats = [
  { icon: Users, value: "4,200+", label: "Businesses on Scryme" },
  { icon: Globe, value: "18", label: "Countries" },
  { icon: TrendingUp, value: "$3.8M+", label: "Transactions daily" },
  { icon: Award, value: "4.9 / 5", label: "Customer satisfaction" },
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
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 bg-surface-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Our story
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight text-balance mb-7">
            The ERP built for businesses that can&apos;t afford to stop
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto text-pretty leading-relaxed">
            We built Scryme after watching too many retailers lose hours every week reconciling
            spreadsheets, battling unreliable POS systems, and missing growth because their tools
            were designed for someone else. Scryme is different — purpose-built for the businesses
            that keep the economy moving.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-background border-y border-border">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-surface-1">
        <div className="mx-auto max-w-6xl px-6 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Our mission
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-6">
              Give every business the tools that used to require a Fortune 500 budget
            </h2>
            <p className="text-base text-muted leading-relaxed mb-6">
              Enterprise ERP platforms have long been out of reach for independent retailers and
              mid-market wholesalers — priced in six-figure implementation fees and requiring
              dedicated IT departments to maintain.
            </p>
            <p className="text-base text-muted leading-relaxed">
              Scryme changes that. We ship a unified platform — CRM, POS, Inventory, and Finance —
              that a 10-person team can run as confidently as a 10,000-person organisation. Our
              pricing is transparent, our onboarding is measured in days not months, and our support
              is staffed by people who understand retail and wholesale.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-border bg-background p-8 space-y-4">
              {[
                { year: "2019", milestone: "Founded in Accra, Ghana. First POS beta shipped to 12 local retailers." },
                { year: "2021", milestone: "Launched CRM and Inventory modules. Reached 500 businesses across West Africa." },
                { year: "2022", milestone: "Series A funding. Expanded to UK and Southeast Asia markets." },
                { year: "2023", milestone: "Launched Finance module and Tauri desktop POS. Crossed 2,000 customers." },
                { year: "2025", milestone: "4,200+ businesses in 18 countries. $3.8M+ daily transactions processed." },
              ].map(({ year, milestone }) => (
                <div key={year} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-primary">{year}</span>
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <p className="text-sm text-muted leading-relaxed pb-4">{milestone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-surface-2 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              How we work
            </p>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Principles we build around
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-7 hover:border-primary/40 transition-colors"
              >
                <h3 className="text-base font-semibold text-foreground mb-3">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Leadership
            </p>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              The team behind the platform
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {team.map(({ name, role, initials }) => (
              <div key={name} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg mx-auto mb-3">
                  {initials}
                </div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-[11px] text-muted mt-0.5 leading-snug">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface-2 border-t border-border">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground text-balance mb-5">
            Ready to see Scryme in action?
          </h2>
          <p className="text-base text-muted mb-8 text-pretty">
            Book a 30-minute walkthrough with one of our product specialists. No slides — just a
            live demo tailored to your business.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={`${webUrl}/sign-up`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`${webUrl}/sign-up`}
              className="inline-flex items-center gap-2 rounded-lg border border-border text-foreground px-6 py-3 text-sm font-semibold hover:bg-surface-1 transition-colors"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
