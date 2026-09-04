import { Metadata } from "next";
import { SignupPageClient } from "./signup-client";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Scryme account to register your organization and manage multi-branch operations, POS systems, and inventory.",
};

export default function Page() {
  return <SignupPageClient />;
}
