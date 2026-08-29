import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Stock Requests",
  description: "Create and track internal stock replenishment requests across branches.",
};

export default function Page() {
  return <ClientPage />;
}
