import "server-only";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";

export async function getOrganizationContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  // Use the active organization ID from the session, if available.
  const organizationId =
    (session.session as any).activeOrganizationId ||
    (session.user as any).activeOrganizationId;

  return {
    user: session.user,
    organizationId,
  };
}
