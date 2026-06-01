import './globals.css';
import { SidebarWrapper } from '../components/sidebar-wrapper';
import { Toaster } from "@repo/ui/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fa] font-sans antialiased">
        <div className="flex h-screen overflow-hidden">
          <SidebarWrapper />
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
