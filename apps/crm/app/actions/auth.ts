'use server';

import { auth } from '../../lib/auth';
import { headers } from 'next/headers';
import { db } from '@repo/db';

export async function getOrganizationContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  // Use the active organization ID from the session, if available.
  // We use casting to any to avoid TypeScript errors if the schema isn't perfectly synced
  const organizationId = (session.session as any).activeOrganizationId || (session.user as any).activeOrganizationId;

  const member = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    }
  });

  return {
    user: session.user,
    organizationId,
    memberId: member?.id,
  };
}
