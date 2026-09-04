import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Organization Suspended",
  description: "Organization subscription or access suspended.",
};

export default function Page() {
  return <ClientPage />;
}
