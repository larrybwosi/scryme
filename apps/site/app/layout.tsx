import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
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
  ],
  authors: [{ name: "Scryme" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Scryme — Enterprise Business Platform",
    description:
      "All-in-one enterprise platform for CRM, POS, Inventory, and Finance.",
    siteName: "Scryme",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme — Enterprise Business Platform",
    description:
      "All-in-one enterprise platform for CRM, POS, Inventory, and Finance.",
  },
  robots: {
    index: true,
    follow: true,
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
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
