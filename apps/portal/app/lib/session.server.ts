"use server";
import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    user: session.user as any,
    customerId: (session.user as any).customerId,
    orgId: (session.user as any).organizationId
  };
}

export async function requireSession(orgSlug: string) {
  const session = await getSession();
  if (!session) redirect("/" + orgSlug + "/login");
  return session;
}
