import type { Access, AccessArgs, Where } from 'payload';

export type UserSession = {
  id: string;
  email: string;
  roles?: string[];
  organizations?: Array<{
    id: string;
    organizationId: string;
    role?: string;
  }>;
};

/**
 * Ensures user can only access documents belonging to their assigned organizations
 */
export const tenantAccess: Access = ({ req }: AccessArgs) => {
  const user = req.user as UserSession | null;

  if (!user) {
    return false;
  }

  // Super admin can access all tenants
  if (user.roles?.includes('admin')) {
    return true;
  }

  const userOrgIds = user.organizations?.map((org) => org.organizationId || org.id) || [];

  if (userOrgIds.length === 0) {
    return false;
  }

  return {
    organization: {
      in: userOrgIds,
    },
  } as Where;
};

/**
 * Public access rule for read-only product marketing content.
 * Published documents are publicly viewable, or authenticated tenant members can view drafts.
 */
export const publicOrTenantAccess: Access = ({ req }: AccessArgs) => {
  const user = req.user as UserSession | null;

  if (user) {
    if (user.roles?.includes('admin')) {
      return true;
    }
    const userOrgIds = user.organizations?.map((org) => org.organizationId || org.id) || [];
    if (userOrgIds.length > 0) {
      return {
        or: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            organization: {
              in: userOrgIds,
            },
          },
        ],
      } as Where;
    }
  }

  return {
    _status: {
      equals: 'published',
    },
  } as Where;
};
