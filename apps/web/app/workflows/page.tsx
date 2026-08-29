import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Automated Workflows",
  description: "Configure triggers, automated actions, and business workflow pipelines.",
};

export default function Page() {
  return <ClientPage />;
}
