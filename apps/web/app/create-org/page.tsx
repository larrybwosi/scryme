import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Create Organization",
  description: "Set up a new organization on Scryme to begin managing inventory, branches, and point-of-sale systems.",
};

export default function Page() {
  return <ClientPage />;
}
