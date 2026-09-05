import type { Metadata } from "next";
import { DownloadPageClient } from "./client";
import { getPageMetadata } from "@/lib/sanity";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    fallbackTitle: "Download Scryme POS — Desktop Point of Sale Application",
    fallbackDescription:
      "Download native Scryme POS builds for Windows, macOS, and Linux across specialized variants including Retail, Restaurant, Supermarket, Pharmacy, and Standalone.",
    canonicalPath: "/download",
  });
}

export default function DownloadPage() {
  return <DownloadPageClient />;
}
