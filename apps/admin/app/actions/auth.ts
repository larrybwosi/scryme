"use server";

import { auth } from "@repo/auth/server";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@repo/db";

export async function requireSuperAdmin() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    redirect("/login");
  }

  const systemRole =
    (session.user as any).systemRole || (session.user as any).role;

  // If already SUPER_ADMIN, allow access directly
  if (systemRole === "SUPER_ADMIN") {
    return session;
  }

  // If this is an impersonated session, check if the admin is impersonating
  const impersonatedBy = (session.session as any).impersonatedBy;
  if (impersonatedBy) {
    const adminUser = await db.user.findUnique({
      where: { id: impersonatedBy },
      select: { id: true, role: true },
    });
    if (adminUser?.role === "SUPER_ADMIN") {
      return {
        ...session,
        isImpersonating: true,
        impersonatorId: adminUser.id,
      };
    }
  }

  // Also check admin_session cookie if present
  const cookieStore = await cookies();
  const hasAdminCookie =
    cookieStore.has("better-auth.admin_session") ||
    cookieStore.has("__Secure-better-auth.admin_session") ||
    cookieStore.has("admin_session") ||
    cookieStore.has("__Secure-admin_session");

  if (hasAdminCookie) {
    return {
      ...session,
      isImpersonating: true,
    };
  }

  redirect("/forbidden");
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
