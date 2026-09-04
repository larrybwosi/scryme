import { Metadata } from "next";
import LoginPage from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Scryme CRM to access your enterprise dashboard, leads, pipeline, and customer relationships.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Sign In | Scryme CRM",
    description:
      "Sign in to Scryme CRM to access your enterprise dashboard, leads, pipeline, and customer relationships.",
    url: "https://crm.scryme.tech/login",
  },
};

export default function Page() {
  return <LoginPage />;
}
