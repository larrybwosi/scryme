import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { QueryProvider } from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "Scryme Projects - Kinetic Precision Workspace",
  description: "Enterprise project management, schedules, gantt timelines, and task tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body-md text-body-md text-on-surface antialiased">
        <QueryProvider>
          <Sidebar />
          <div className="pl-60 min-h-screen flex flex-col">
            <Header />
            <main className="relative pt-12 min-h-screen bg-surface w-full px-8 pb-16">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
