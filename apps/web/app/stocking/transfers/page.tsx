import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Stock Transfers",
  description: "Manage inter-branch inventory transfers, shipments, and dispatch confirmations.",
};

export default function Page() {
  return <ClientPage />;
}
