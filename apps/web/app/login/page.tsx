import React from "react";
import { Metadata } from "next";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Scryme account to access your organization's dashboard, POS, inventory, and management tools.",
};

export default function LoginPage() {
  return (
    <LoginPageClient
      displayClass="font-serif"
      sansClass="font-sans"
      monoClass="font-mono"
      displayVar=""
      sansVar=""
      monoVar=""
    />
  );
}
