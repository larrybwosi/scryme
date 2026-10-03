import type { CollectionBeforeChangeHook } from 'payload';
import type { UserSession } from '../access/tenantAccess';

/**
 * Automatically sets the document's organization field to the active user's primary organization if not set.
 */
export const setTenantBeforeChange: CollectionBeforeChangeHook = ({ req, data }) => {
  const user = req.user as UserSession | null;

  if (data && !data.organization && user) {
    const userOrg = user.organizations?.[0];
    if (userOrg) {
      data.organization = userOrg.organizationId || userOrg.id;
    }
  }

  return data;
};
