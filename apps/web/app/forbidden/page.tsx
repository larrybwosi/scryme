import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Access Forbidden",
  description: "You do not have permission to access this resource.",
};

export default function Page() {
  return <ClientPage />;
}
