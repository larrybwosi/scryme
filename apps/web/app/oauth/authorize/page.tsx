import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Authorize Application",
  description: "Grant authorization for external integrations and applications to connect to your Scryme account.",
};

export default function Page() {
  return <ClientPage />;
}
