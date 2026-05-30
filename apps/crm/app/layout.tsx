import './globals.css';
import { Sidebar } from '../components/sidebar';
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
          <Sidebar />
          <main className="flex-1 overflow-hidden bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
