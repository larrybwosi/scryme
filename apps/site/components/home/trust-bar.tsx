const brands = [
  "Westfield Retail",
  "Meridian Corp",
  "Fontaine Group",
  "Harlen & Co.",
  "Argent Industries",
  "Solis Distributors",
  "Kestrel Holdings",
];

export function TrustBar() {
  return (
    <section
      className="border-y border-border py-10"
      style={{ background: "var(--card)" }}
      aria-label="Trusted by"
    >
      <div className="container mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-7">
          Trusted by enterprise teams across industries
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-sm font-semibold tracking-tight"
              style={{ color: "oklch(0.72 0.01 265)" }}
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
