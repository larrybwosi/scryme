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
      <body className="min-h-screen bg-[#0d0e11] text-slate-100 flex antialiased">
        <QueryProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-5 overflow-y-auto">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
