import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { OpenPanelProvider } from "@/components/openpanel-provider";
import { TelemetryProvider } from "@repo/shared/telemetry/client";
import { PostHogProvider } from "@/components/posthog-provider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Platform Admin | Scryme",
  description: "Internal platform administration console for Scryme.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TelemetryProvider service="admin-app">
          <OpenPanelProvider />
          <PostHogProvider>
            <Providers>{children}</Providers>
          </PostHogProvider>
        </TelemetryProvider>
      </body>
    </html>
  );
}
