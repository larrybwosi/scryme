import { Metadata, Viewport } from "next";
import "./globals.css";
import { SidebarWrapper } from "../components/sidebar-wrapper";
import { Providers } from "@/lib/providers";
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
  description: "Enterprise CRM & Client Relationship Management platform by Scryme. Manage leads, customers, pipelines, campaigns, and contacts seamlessly with built-in automation.",
  metadataBase: new URL("https://crm.scryme.tech"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Scryme CRM | Client Relationship Management",
    description: "Manage leads, customers, pipelines, campaigns, and contacts seamlessly with built-in automation.",
    url: "https://crm.scryme.tech",
    siteName: "Scryme CRM",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme CRM | Client Relationship Management",
    description: "Manage leads, customers, pipelines, campaigns, and contacts seamlessly with built-in automation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d3d2b",
  width: "device-width",
  initialScale: 1,
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
      </head>
      <body className="bg-[#f8f9fa] font-sans antialiased">
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
