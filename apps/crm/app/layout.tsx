import './globals.css';
import { SidebarWrapper } from '../components/sidebar-wrapper';
import { Toaster } from "@repo/ui/components/ui/sonner";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scryme CRM',
  description: 'Enterprise Customer Relationship Management — Scryme',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased text-foreground">
        <div className="flex h-screen overflow-hidden">
          <SidebarWrapper />
          <main className="flex-1 overflow-hidden bg-background">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
