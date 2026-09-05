import type { Metadata } from "next";
import { DownloadPageClient } from "./client";
import { PageBuilder } from "@/components/sections/page-builder";
import { getCmsPage, getPageMetadata } from "@/lib/sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("download");
  return getPageMetadata({
    pageSeo: page?.seo,
    fallbackTitle: "Download Scryme POS — Desktop Point of Sale Application",
    fallbackDescription:
      "Download native Scryme POS builds for Windows, macOS, and Linux across specialized variants including Retail, Restaurant, Supermarket, Pharmacy, and Standalone.",
    canonicalPath: "/download",
  });
}

export default async function DownloadPage() {
  const cmsPage = await getCmsPage("download");
  if (cmsPage?.sections?.length) {
    return (
      <main id="main-content">
        <PageBuilder sections={cmsPage.sections} />
      </main>
    );
  }

  return <DownloadPageClient />;
}
