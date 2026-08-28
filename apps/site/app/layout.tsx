import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { StructuredData } from "@/components/seo/structured-data";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LayoutContent } from "@/components/layout/layout-content";
import "./globals.css";
import { env } from "@repo/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scryme.tech"),
  title: {
    default: "Scryme — High-Performance Commerce & Scale Platform",
    template: "%s | Scryme",
  },
  description:
    "Scryme is the high-performance commerce and scale platform built to empower modern businesses. We combine integrated offline-first POS, multi-branch syncing, advanced stock management, and centralized corporate control with automated e-commerce storefront websites.",
  keywords: [
    "ERP",
    "CRM",
    "Point of Sale",
    "POS",
    "Multi-Branch Retail",
    "Storefront Websites",
    "Stock Management",
    "Inventory Management",
    "Business Scale Software",
    "Enterprise Platform",
    "Retail Software",
    "SaaS",
    "Wholesale ERP",
    "Cloud POS",
  ],
  authors: [{ name: "Scryme", url: "https://scryme.tech" }],
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
    url: "https://scryme.tech",
    title: "Scryme — High-Performance Commerce & Scale Platform",
    description:
      "Integrated POS, multi-branch operations, central management, stock tracking, and automated client storefront websites.",
    siteName: "Scryme",
    images: [
      {
        url: "https://scryme.tech/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scryme — High-Performance Commerce & Scale Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme — High-Performance Commerce & Scale Platform",
    description:
      "Integrated POS, multi-branch operations, central management, stock tracking, and automated client storefront websites.",
    creator: "@scryme",
    images: ["https://scryme.tech/og-image.png"],
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
  themeColor: "#0b1220",
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
    url: "https://scryme.tech",
    logo: "https://scryme.tech/logo.png",
    sameAs: [
      "https://twitter.com/scryme",
      "https://linkedin.com/company/scryme",
    ],
    description:
      "Scryme is the high-performance commerce and scale platform built to empower modern businesses. We combine integrated offline-first POS, multi-branch syncing, advanced stock management, and centralized corporate control with automated e-commerce storefront websites.",
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
    url: "https://scryme.tech",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://scryme.tech/search?q={search_term_string}",
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
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV = {
            NEXT_PUBLIC_SITE_SANITY_PROJECT_ID: ${JSON.stringify(env.NEXT_PUBLIC_SITE_SANITY_PROJECT_ID)},
            NEXT_PUBLIC_SITE_SANITY_DATASET: ${JSON.stringify(env.NEXT_PUBLIC_SITE_SANITY_DATASET)},
            NEXT_PUBLIC_API_URL: ${JSON.stringify(env.NEXT_PUBLIC_API_URL)}
          };`,
          }}
        />
      </head>
      <body className="font-sans antialiased text-foreground">
        <a href="#main-content" className="sr-only fixed left-4 top-4 rounded-md bg-background px-4 py-3 text-foreground shadow-lg focus:not-sr-only">Skip to main content</a>
        <ThemeProvider>
          <StructuredData data={organizationData} />
          <StructuredData data={websiteData} />
          <StructuredData data={softwareData} />
          <LayoutContent>{children}</LayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}
