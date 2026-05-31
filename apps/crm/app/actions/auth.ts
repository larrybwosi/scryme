'use server';

import { auth } from '../../lib/auth';
import { headers } from 'next/headers';

export async function getOrganizationContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  // Use the active organization ID from the session, if available.
  // Better Auth sessions often include activeOrganizationId or similar fields
  // depending on the plugins enabled (like the organization plugin).
  const organizationId = session.session.activeOrganizationId || session.user.activeOrganizationId;

  return {
    user: session.user,
    organizationId,
  };
}
