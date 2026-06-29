import type { Metadata } from "next";
import { Users, GitBranch, BarChart2, Bell, Mail, Zap, Lock, Globe } from "lucide-react";
import { ProductHero } from "@/components/products/product-hero";
import { FeatureSection } from "@/components/products/feature-section";
import { CrmPipelineMock } from "@/components/products/crm/crm-pipeline-mock";
import { CrmContactMock } from "@/components/products/crm/crm-contact-mock";
import { CrmAnalyticsMock } from "@/components/products/crm/crm-analytics-mock";
import { PricingCTA } from "@/components/home/pricing-cta";

export const metadata: Metadata = {
  title: "CRM — Scryme",
  description:
    "Scryme CRM gives sales teams a visual pipeline, unified contact records, automated follow-ups, and real-time analytics to close more deals faster.",
};

const capabilities = [
  { icon: GitBranch, label: "Visual Pipeline" },
  { icon: Users, label: "Contact Intelligence" },
  { icon: Mail, label: "Email Sequences" },
  { icon: Bell, label: "Smart Alerts" },
  { icon: BarChart2, label: "Revenue Analytics" },
  { icon: Zap, label: "Workflow Automation" },
  { icon: Lock, label: "Role-Based Access" },
  { icon: Globe, label: "Multi-org Support" },
];

export default function CrmPage() {
  return (
    <main>
      <ProductHero
        eyebrow="Scryme CRM"
        title="Close more deals with a pipeline built for scale"
        description="From first contact to closed-won, Scryme CRM gives your sales team a single, visual workspace — with AI-assisted follow-ups, deal scoring, and revenue forecasting built in."
        iconSlot={<Users className="w-8 h-8 text-white" />}
        accentColor="oklch(0.55 0.18 265)"
      />

      {/* Capabilities chip row */}
      <section className="py-10 bg-surface-2 border-y border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {capabilities.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted"
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 1 — Pipeline */}
      <FeatureSection
        eyebrow="Visual Pipeline"
        title="See every deal's status at a glance"
        description="Drag-and-drop Kanban stages let your team move deals forward without switching apps. Custom stages, deal weighting, and probability scoring ship out of the box."
        bullets={[
          { text: "Unlimited custom pipeline stages per product line" },
          { text: "Deal probability auto-scoring based on activity signals" },
          { text: "Stale deal alerts when no activity for N days" },
          { text: "One-click bulk stage transitions for batch operations" },
        ]}
      >
        <CrmPipelineMock />
      </FeatureSection>

      {/* Feature 2 — Contact Intelligence */}
      <FeatureSection
        eyebrow="Contact Intelligence"
        title="Every interaction — in one place"
        description="Calls, emails, meetings and notes are automatically linked to the right contact and company. Your reps always know what was said and what needs to happen next."
        bullets={[
          { text: "Automatic email and calendar sync with Gmail & Outlook" },
          { text: "Call recordings transcribed and indexed for search" },
          { text: "AI-generated meeting summaries and next-step suggestions" },
          { text: "Company hierarchy mapping for enterprise accounts" },
        ]}
        reverse
        dark
      >
        <CrmContactMock />
      </FeatureSection>

      {/* Feature 3 — Analytics */}
      <FeatureSection
        eyebrow="Revenue Analytics"
        title="Forecast with confidence, not guesswork"
        description="Scryme CRM surfaces the metrics that matter — win rates, cycle length, and pipeline velocity — so you can plan headcount and quota with real data."
        bullets={[
          { text: "Rolling 12-month revenue forecasts with confidence bands" },
          { text: "Cohort analysis by rep, region, and product" },
          { text: "Pipeline health score with actionable recommendations" },
          { text: "Exportable reports and Slack/Teams digest integrations" },
        ]}
      >
        <CrmAnalyticsMock />
      </FeatureSection>

      {/* Full-width feature list */}
      <section className="py-20 bg-surface-2 border-t border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Everything included
            </p>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              No add-ons required. No hidden tiers.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Workflow Automation",
                desc: "Trigger emails, tasks, and stage moves based on any CRM event — no code needed.",
              },
              {
                title: "Email Sequences",
                desc: "Multi-step outreach cadences with A/B testing and open/click analytics.",
              },
              {
                title: "Lead Scoring",
                desc: "Score inbound leads automatically by company size, engagement, and fit.",
              },
              {
                title: "Territory Management",
                desc: "Assign accounts by region, industry, or round-robin rules with audit logs.",
              },
              {
                title: "Quotation Builder",
                desc: "Generate branded PDF quotes directly from a deal card. E-sign ready.",
              },
              {
                title: "API & Webhooks",
                desc: "Bidirectional sync with your ERP, marketing tools, and data warehouse.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-6 hover:border-primary/40 transition-colors"
              >
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingCTA />
    </main>
  );
}
