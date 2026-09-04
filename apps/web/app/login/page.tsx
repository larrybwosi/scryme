import React from "react";
import { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Scryme account to access your organization's dashboard, POS, inventory, and management tools.",
};

// Define the fonts inside the Server Component (safer for Turbopack and SSR compilation)
const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function LoginPage() {
  return (
    <LoginPageClient
      displayClass={display.className}
      sansClass={sans.className}
      monoClass={mono.className}
      displayVar={display.variable}
      sansVar={sans.variable}
      monoVar={mono.variable}
    />
  );
}
