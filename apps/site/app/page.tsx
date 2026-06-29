import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturesGrid } from "@/components/home/features-grid";
import { PlatformShowcase } from "@/components/home/platform-showcase";
import { StatsStrip } from "@/components/home/stats-strip";
import { CRMTeaser } from "@/components/home/crm-teaser";
import { POSTeaser } from "@/components/home/pos-teaser";
import { Testimonials } from "@/components/home/testimonials";
import { PricingCTA } from "@/components/home/pricing-cta";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <FeaturesGrid />
      <StatsStrip />
      <PlatformShowcase />
      <CRMTeaser />
      <POSTeaser />
      <Testimonials />
      <PricingCTA />
    </main>
  );
}
