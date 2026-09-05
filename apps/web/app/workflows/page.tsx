import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Workflow Studio | Scryme",
  description: "Design, test, govern, and publish enterprise workflow automations in Scryme.",
};

export default function Page() {
  return <ClientPage />;
}
