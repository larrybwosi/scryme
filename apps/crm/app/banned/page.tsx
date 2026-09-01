import { Metadata } from "next";
import BannedClient from "./banned-client";

export const metadata: Metadata = {
  title: "Account Access Restricted",
  description: "Your access to this platform has been restricted or suspended.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BannedPage() {
  return <BannedClient />;
}
