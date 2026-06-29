import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const highlights = [
  "Visual sales pipeline with drag-and-drop Kanban",
  "Automated lead scoring and follow-up sequences",
  "360° customer profiles with interaction history",
  "Email campaigns, segments, and A/B testing",
  "Real-time activity feed and team collaboration",
];

function CRMKanban() {
  const columns = [
    {
      title: "Leads",
      color: "#6366f1",
      cards: [
        { name: "Arjun Mehta", company: "Vantage Corp", value: "$24K" },
        { name: "Sarah Okonkwo", company: "TerraLogix", value: "$18K" },
      ],
    },
    {
      title: "Qualified",
      color: "#0891b2",
      cards: [
        { name: "Elena Vasquez", company: "Meridian Grp.", value: "$47K" },
      ],
    },
    {
      title: "Proposal",
      color: "#d97706",
      cards: [
        { name: "Nkechi Adeyemi", company: "Argent Ind.", value: "$95K" },
        { name: "Jake Thornton", company: "Kestrel LLC", value: "$63K" },
      ],
    },
    {
      title: "Won",
      color: "#059669",
      cards: [
        { name: "Priya Sharma", company: "Solis Dist.", value: "$112K" },
      ],
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}
    >
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-foreground">Sales Pipeline</span>
        </div>
        <span className="text-xs text-muted-foreground">Q4 2025</span>
      </div>

      {/* Kanban columns */}
      <div
        className="flex gap-3 p-4 overflow-x-auto scrollbar-none"
        style={{ background: "var(--muted)" }}
      >
        {columns.map((col) => (
          <div key={col.title} className="flex-1 min-w-[130px]">
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: col.color }}
              />
              <span className="text-xs font-semibold text-foreground">
                {col.title}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.cards.map((card) => (
                <div
                  key={card.name}
                  className="bg-card rounded-lg p-2.5"
                  style={{
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: col.color }}
                    >
                      {card.name[0]}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">
                      {card.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {card.company}
                    </span>
                    <span
                      className="text-xs font-semibold shrink-0 ml-1"
                      style={{ color: "#059669" }}
                    >
                      {card.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline total */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
      >
        <span className="text-xs text-muted-foreground">Pipeline total</span>
        <span className="text-sm font-bold text-foreground">$359,000</span>
      </div>
    </div>
  );
}

export function CRMTeaser() {
  return (
    <section
      className="py-24 bg-background"
      aria-labelledby="crm-teaser-heading"
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text left */}
          <div className="flex-1 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                CRM
              </span>
            </div>
            <h2
              id="crm-teaser-heading"
              className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance"
            >
              Close more deals with an intelligent sales pipeline
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Scryme CRM gives your sales team complete visibility into every
              deal — from first contact to closed contract. Automate the
              routine, focus on relationships.
            </p>

            <ul className="mt-7 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={16}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/products/crm"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ boxShadow: "var(--shadow-primary)" }}
            >
              Explore CRM
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Kanban right */}
          <div className="flex-1 w-full max-w-xl">
            <CRMKanban />
          </div>
        </div>
      </div>
    </section>
  );
}
