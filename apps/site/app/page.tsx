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
import { PageBuilder } from "@/components/sections/page-builder";
import { getHomePageContent, getPageMetadata } from "../lib/sanity";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomePageContent();
  return getPageMetadata({
    pageSeo: content.seo,
    fallbackTitle: "Scryme — High-Performance Commerce & Scale Platform",
    fallbackDescription: "Scryme is the high-performance commerce and scale platform built to empower modern businesses. We combine integrated offline-first POS, multi-branch syncing, advanced stock management, and centralized corporate control with automated e-commerce storefront websites.",
    canonicalPath: "/",
  });
}

export default async function HomePage() {
  const content = await getHomePageContent();

  if (content.sections?.length) {
    return <main id="main-content"><PageBuilder sections={content.sections} /></main>;
  }

  return (
    <main id="main-content">
      <Hero
        data={{
          heroTitle: content.heroTitle,
          heroSubtitle: content.heroSubtitle,
          heroImage: content.heroImage,
          heroVideo: content.heroVideo,
          reconciledToday: content.reconciledToday,
        }}
      />
      <TrustBar brands={content.brands} />
      <PlatformShowcase />
      <FeaturesGrid modules={content.modules} />
      <StatsStrip stats={content.stats} />
      <SolutionsSpotlight
        data={{
          storefrontTitle: content.storefrontTitle,
          storefrontSubtitle: content.storefrontSubtitle,
          storefrontImage: content.storefrontImage,
          multiBranchTitle: content.multiBranchTitle,
          multiBranchSubtitle: content.multiBranchSubtitle,
          multiBranchImage: content.multiBranchImage,
          cmsTitle: content.cmsTitle,
          cmsSubtitle: content.cmsSubtitle,
          cmsImage: content.cmsImage,
        }}
      />
      <CRMTeaser
        data={{
          crmTeaserTitle: content.crmTeaserTitle,
          crmTeaserSubtitle: content.crmTeaserSubtitle,
          crmTeaserImage: content.crmTeaserImage,
        }}
      />
      <POSTeaser
        data={{
          posTeaserTitle: content.posTeaserTitle,
          posTeaserSubtitle: content.posTeaserSubtitle,
          posTeaserImage: content.posTeaserImage,
        }}
      />
      <Testimonials testimonials={content.testimonials} />
      <PricingCTA />
    </main>
  );
}
