import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Integrations & Apps",
  description: "Connect payment gateways, webhooks, Windmill workflows, and third-party tools.",
};

export default function Page() {
  return <ClientPage />;
}
