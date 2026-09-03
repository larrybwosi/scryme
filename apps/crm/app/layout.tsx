import { Metadata, Viewport } from "next";
import "./globals.css";
import { SidebarWrapper } from "../components/sidebar-wrapper";
import { Providers } from "@/lib/providers";
import { OpenPanelProvider } from "../components/openpanel-provider";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: {
    default: "CRM | Client Relationship Management | Scryme",
    template: "%s | Scryme CRM",
  },
  description:
    "Enterprise CRM & Client Relationship Management platform by Scryme. Manage leads, customers, pipelines, marketing campaigns, and contacts seamlessly with built-in automation and intelligence.",
  keywords: [
    "CRM",
    "Client Relationship Management",
    "Sales Pipeline",
    "Lead Management",
    "Customer Insights",
    "Contact Directory",
    "Marketing Campaigns",
    "Workflow Automation",
    "Business Intelligence",
    "Scryme CRM",
  ],
  authors: [{ name: "Scryme", url: "https://scryme.tech" }],
  creator: "Scryme",
  publisher: "Scryme",
  applicationName: "Scryme CRM",
  category: "Business & Productivity",
  metadataBase: new URL("https://crm.scryme.tech"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Scryme CRM | Enterprise Client Relationship Management",
    description:
      "Manage leads, customers, pipelines, marketing campaigns, and contacts seamlessly with built-in automation and intelligence.",
    url: "https://crm.scryme.tech",
    siteName: "Scryme CRM",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scryme CRM Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme CRM | Enterprise Client Relationship Management",
    description:
      "Manage leads, customers, pipelines, marketing campaigns, and contacts seamlessly with built-in automation and intelligence.",
    creator: "@scryme",
    images: ["/og-image.png"],
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d3d2b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Scryme CRM",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://crm.scryme.tech",
      "description":
        "Enterprise CRM & Client Relationship Management platform by Scryme. Track leads, manage customer contacts, automate sales pipelines, run marketing campaigns, and analyze deals.",
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
      "logo": "https://crm.scryme.tech/favicon.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <link rel="preconnect" href="https://api.scryme.tech" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.scryme.tech" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#f8f9fa] font-sans antialiased">
        <OpenPanelProvider />
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <SidebarWrapper />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
