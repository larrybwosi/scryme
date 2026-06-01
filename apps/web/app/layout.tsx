import './globals.css';
import { AppSidebar } from '../components/app-sidebar';
import { Toaster } from "@repo/ui/components/ui/sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { SidebarWrapper } from '../components/sidebar-wrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fa] font-sans antialiased">
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <SidebarWrapper />
            <SidebarInset className="flex flex-col overflow-hidden">
              <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:hidden">
                <SidebarTrigger className="-ml-1" />
              </header>
              <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
