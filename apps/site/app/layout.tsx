import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { StructuredData } from "@/components/seo/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scryme.co"),
  title: {
    default: "Scryme — Enterprise Business Platform",
    template: "%s | Scryme",
  },
  description:
    "Scryme is the all-in-one enterprise platform for CRM, Point of Sale, Inventory, and Finance — built for retailers, wholesalers, and multi-branch businesses.",
  keywords: [
    "ERP",
    "CRM",
    "Point of Sale",
    "POS",
    "Inventory Management",
    "Business Software",
    "Enterprise Platform",
    "Retail Software",
    "SaaS",
    "Wholesale ERP",
    "Cloud POS",
  ],
  authors: [{ name: "Scryme", url: "https://scryme.co" }],
  creator: "Scryme",
  publisher: "Scryme",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://scryme.co",
    title: "Scryme — Enterprise Business Platform",
    description:
      "All-in-one enterprise platform for CRM, POS, Inventory, and Finance.",
    siteName: "Scryme",
    images: [
      {
        url: "https://scryme.co/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scryme — Enterprise Business Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme — Enterprise Business Platform",
    description:
      "All-in-one enterprise platform for CRM, POS, Inventory, and Finance.",
    creator: "@scryme",
    images: ["https://scryme.co/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#4338ca",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Scryme",
    alternateName: "Scryme Technologies",
    url: "https://scryme.co",
    logo: "https://scryme.co/logo.png",
    sameAs: [
      "https://twitter.com/scryme",
      "https://linkedin.com/company/scryme",
    ],
    description: "Scryme is the all-in-one enterprise platform for CRM, Point of Sale, Inventory, and Finance.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-800-SCRYME",
      contactType: "customer service",
      availableLanguage: ["en"],
    },
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Scryme",
    url: "https://scryme.co",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://scryme.co/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const softwareData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Scryme POS",
    operatingSystem: "Windows, macOS, Linux",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground">
        <StructuredData data={organizationData} />
        <StructuredData data={websiteData} />
        <StructuredData data={softwareData} />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
