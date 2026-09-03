import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SidebarWrapper } from "../components/sidebar-wrapper";
import { Providers } from "@/lib/providers";
import { OpenPanelProvider } from "../components/openpanel-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://app.scryme.tech"),
  title: {
    default: "Scryme — Enterprise Resource Planning & Management",
    template: "%s | Scryme",
  },
  description:
    "Scryme Web Application — Complete enterprise resource planning, multi-branch inventory management, POS control, financial accounting, and staff administration.",
  keywords: [
    "Scryme",
    "ERP",
    "Enterprise Resource Planning",
    "Inventory Management",
    "POS Management",
    "Financial Accounting",
    "Staff Roster",
    "Stock Control",
    "Multi-Branch",
  ],
  authors: [{ name: "Scryme", url: "https://scryme.tech" }],
  creator: "Scryme",
  publisher: "Scryme",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.scryme.tech",
    title: "Scryme — Enterprise Resource Planning & Management",
    description:
      "Complete enterprise resource planning, multi-branch inventory management, POS control, financial accounting, and staff administration.",
    siteName: "Scryme ERP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scryme — Enterprise Resource Planning & Management",
    description:
      "Complete enterprise resource planning, multi-branch inventory management, POS control, financial accounting, and staff administration.",
    creator: "@scryme",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (_) {}
        ` }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
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
