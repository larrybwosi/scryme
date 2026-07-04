import './globals.css';
import { SidebarWrapper } from '../components/sidebar-wrapper';
import { Toaster } from "@repo/ui/components/ui/sonner";
import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { RealtimeProvider } from "@repo/shared/realtime/client";
import { TopLoader } from '../components/top-loader';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#34A853',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Scryme ERP - Enterprise Management Platform',
    template: '%s | Scryme ERP',
  },
  description: 'Scryme is an enterprise-grade ERP platform for retail and wholesale businesses. Manage inventory, sales, customers, and financial integrations seamlessly.',
  keywords: ['ERP', 'Inventory Management', 'POS', 'Retail', 'Wholesale', 'Supply Chain', 'Scryme'],
  authors: [{ name: 'Scryme Team' }],
  creator: 'Scryme',
  publisher: 'Scryme',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scryme.com',
    siteName: 'Scryme ERP',
    title: 'Scryme ERP - Enterprise Management Platform',
    description: 'Empower your business with Scryme’s unified ecosystem for inventory, sales, and analytics.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scryme ERP Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scryme ERP - Enterprise Management Platform',
    description: 'Empower your business with Scryme’s unified ecosystem for inventory, sales, and analytics.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fa] font-sans antialiased">
        <TopLoader />
        <TooltipProvider>
          <RealtimeProvider>
            <div className="flex h-screen overflow-hidden">
              <SidebarWrapper />
              <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
              </main>
            </div>
          </RealtimeProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
