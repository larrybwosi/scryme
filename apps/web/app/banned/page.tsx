import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Account Suspended",
  description: "Your account access has been restricted.",
};

export default function Page() {
  return <ClientPage />;
}
