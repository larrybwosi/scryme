const testimonials = [
  {
    quote:
      "Scryme replaced four separate systems we were running. Our operations team now has a single dashboard for everything — inventory, POS, CRM, and finance. The ROI in the first quarter alone paid for the full-year subscription.",
    name: "Amara Diallo",
    title: "Chief Operating Officer",
    company: "Fontaine Group",
    initials: "AD",
    color: "#4f46e5",
  },
  {
    quote:
      "We run 23 retail branches across three regions. Before Scryme, reconciling end-of-day sales was a half-day job. Now it takes minutes. The multi-branch inventory visibility alone is a game changer.",
    name: "Marcus Chen",
    title: "Head of Retail Operations",
    company: "Westfield Retail Holdings",
    initials: "MC",
    color: "#0891b2",
  },
  {
    quote:
      "The CRM pipeline gave our sales team a new level of accountability. We went from guessing what was in the pipeline to having real-time data on every deal. Deal velocity improved 40% in our first six months.",
    name: "Sophia Hargreaves",
    title: "VP of Sales",
    company: "Meridian Corp",
    initials: "SH",
    color: "#059669",
  },
];

export function Testimonials() {
  return (
    <section
      className="py-24 bg-background"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Customer Stories
            </span>
          </div>
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl font-extrabold text-foreground text-balance"
          >
            Trusted by industry leaders
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Businesses across retail, wholesale, and distribution rely on Scryme
            every day.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="bg-card rounded-xl p-7 flex flex-col border border-border hover:border-primary/25 hover:shadow-md transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 10 10" fill="#fbbf24" aria-hidden="true">
                    <path d="M5 0.5L6.18 3.41H9.26L6.77 5.2L7.95 8.11L5 6.27L2.05 8.11L3.23 5.2L0.74 3.41H3.82L5 0.5Z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              <footer className="mt-6 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <cite className="not-italic text-sm font-semibold text-foreground">
                    {t.name}
                  </cite>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.title}, {t.company}
                  </div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
