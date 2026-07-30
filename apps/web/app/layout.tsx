import "./globals.css";
import { SidebarWrapper } from "../components/sidebar-wrapper";
import { Providers } from "@/lib/providers";

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
            if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (_) {}
        ` }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
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
