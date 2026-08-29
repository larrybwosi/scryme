import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "API Credentials & Keys",
  description: "Generate API tokens, manage OAuth clients, and view API usage metrics.",
};

export default function Page() {
  return <ClientPage />;
}
