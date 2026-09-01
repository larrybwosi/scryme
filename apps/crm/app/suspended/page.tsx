import { Metadata } from "next";
import SuspendedClient from "./suspended-client";

export const metadata: Metadata = {
  title: "Organization Suspended",
  description: "Organization access to the platform has been suspended.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuspendedPage() {
  return <SuspendedClient />;
}
