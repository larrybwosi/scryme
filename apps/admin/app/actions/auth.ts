"use server";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireSuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") {
    redirect("/forbidden");
  }

  return session;
}

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return session.user;
}
