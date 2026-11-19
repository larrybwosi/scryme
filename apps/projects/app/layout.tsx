import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { QueryProvider } from "@/components/QueryProvider";
import { OpenPanelProvider } from "@/components/openpanel-provider";
import { TelemetryProvider } from "@repo/shared/telemetry/client";

export const metadata: Metadata = {
  title: "Scryme Projects - Kinetic Precision Workspace",
  description:
    "Enterprise project management, schedules, gantt timelines, and task tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-surface font-body-md text-body-md text-on-surface antialiased"
        suppressHydrationWarning
      >
        <TelemetryProvider service="projects-app">
          <OpenPanelProvider />
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
        </TelemetryProvider>
      </body>
    </html>
  );
}
