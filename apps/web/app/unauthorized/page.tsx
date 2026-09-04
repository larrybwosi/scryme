import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Unauthorized Access",
  description: "Authentication required to access this page.",
};

export default function Page() {
  return <ClientPage />;
}
