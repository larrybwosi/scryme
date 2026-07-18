"use server";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { db } from "@repo/db";
import { redirect } from "next/navigation";

export async function getOrganizationContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Use the active organization ID from the session, if available.
  const organizationId =
    (session.session as any).activeOrganizationId ||
    (session.user as any).activeOrganizationId;

  const member = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  return {
    user: session.user,
    organizationId,
    memberId: member?.id,
    member,
  };
}

export async function getCurrentMember() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const organizationId =
    (session.session as any).activeOrganizationId ||
    (session.user as any).activeOrganizationId;

  const member = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  return member;
}
