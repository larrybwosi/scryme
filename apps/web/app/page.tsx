import { Metadata } from "next";
import { WebClientRedirect } from "./_components/web-client-redirect";

export const metadata: Metadata = {
  title: "Welcome to Scryme — Enterprise Resource Planning & Management",
  description:
    "All-in-one cloud platform for multi-branch inventory, supplier management, POS operations, financial accounting, and enterprise administration.",
  keywords: [
    "Scryme",
    "ERP",
    "Enterprise Resource Planning",
    "Inventory Management",
    "POS Operations",
    "Financial Accounting",
    "Supplier Management",
    "Multi-Branch Cloud ERP",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Scryme — Enterprise Resource Planning & Management",
    description:
      "All-in-one cloud platform for multi-branch inventory, supplier management, POS operations, financial accounting, and enterprise administration.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://app.scryme.tech",
    siteName: "Scryme ERP",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scryme ERP Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme — Enterprise Resource Planning & Management",
    description:
      "All-in-one cloud platform for multi-branch inventory, supplier management, POS operations, financial accounting, and enterprise administration.",
    creator: "@scryme",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Scryme ERP",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": process.env.NEXT_PUBLIC_APP_URL || "https://app.scryme.tech",
      "description":
        "All-in-one cloud platform for multi-branch inventory, supplier management, POS operations, financial accounting, and enterprise administration.",
      "publisher": {
        "@type": "Organization",
        "name": "Scryme",
        "url": "https://scryme.tech",
      },
    },
    {
      "@type": "Organization",
      "name": "Scryme",
      "url": "https://scryme.tech",
      "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://app.scryme.tech"}/favicon.ico`,
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WebClientRedirect />
    </>
  );
}
