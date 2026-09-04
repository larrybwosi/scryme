import { Metadata } from "next";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Scryme account password securely.",
};

export default function Page() {
  return <ClientPage />;
}
