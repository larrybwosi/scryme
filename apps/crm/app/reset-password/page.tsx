import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Reset Password | Scryme CRM",
  description: "Reset your Scryme CRM account password securely.",
};

export default function Page() {
  return <ClientPage />;
}
