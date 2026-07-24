import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturesGrid } from "@/components/home/features-grid";
import { PlatformShowcase } from "@/components/home/platform-showcase";
import { SolutionsSpotlight } from "@/components/home/solutions-spotlight";
import { StatsStrip } from "@/components/home/stats-strip";
import { CRMTeaser } from "@/components/home/crm-teaser";
import { POSTeaser } from "@/components/home/pos-teaser";
import { Testimonials } from "@/components/home/testimonials";
import { PricingCTA } from "@/components/home/pricing-cta";
import { getHomePageContent } from "../lib/sanity";

export const revalidate = 60;

export default async function HomePage() {
  const content = await getHomePageContent();

  return (
    <main>
      <Hero data={{
        heroTitle: content.heroTitle,
        heroSubtitle: content.heroSubtitle,
        reconciledToday: content.reconciledToday,
      }} />
      <TrustBar brands={content.brands} />
      <FeaturesGrid modules={content.modules} />
      <StatsStrip stats={content.stats} />
      <PlatformShowcase />
      <SolutionsSpotlight data={{
        storefrontTitle: content.storefrontTitle,
        storefrontSubtitle: content.storefrontSubtitle,
        storefrontImage: content.storefrontImage,
        multiBranchTitle: content.multiBranchTitle,
        multiBranchSubtitle: content.multiBranchSubtitle,
        multiBranchImage: content.multiBranchImage,
        stockManagementTitle: content.stockManagementTitle,
        stockManagementSubtitle: content.stockManagementSubtitle,
        stockManagementImage: content.stockManagementImage,
      }} />
      <CRMTeaser />
      <POSTeaser />
      <Testimonials testimonials={content.testimonials} />
      <PricingCTA />
    </main>
  );
}
