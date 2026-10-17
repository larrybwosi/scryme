import { Metadata } from "next";
import { getServerAuth } from "@repo/auth/server";
import ClientPage from "./client";

export const metadata: Metadata = {
  title: "Payment / Free Trial Expired",
  description: "Organization subscription or free trial has expired.",
};

export default async function Page() {
  const auth = await getServerAuth({ allowExpired: true });
  const isOwnerOrAdmin = auth?.role === "OWNER" || auth?.role === "ADMIN" || auth?.systemRole === "SUPER_ADMIN";

  return <ClientPage userRole={auth?.role} isOwnerOrAdmin={isOwnerOrAdmin} userEmail={auth?.user?.email} />;
}
