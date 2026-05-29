/**
 * Check if a permission string matches a required permission
 * Handles wildcard (*) and deep nesting (e.g., 'sales:view:*' matches 'sales:view:own')
 */
export const hasPermission = (userPermissions: Set<string> | string[], requiredPermission: string): boolean => {
  const permissionsSet = userPermissions instanceof Set ? userPermissions : new Set(userPermissions);

  // 1. Root wildcard
  if (permissionsSet.has('*')) return true;

  // 2. Exact match
  if (permissionsSet.has(requiredPermission)) return true;

  // 3. Deep wildcard match
  const parts = requiredPermission.split(':');
  for (let i = parts.length; i > 1; i--) {
    const wildcard = [...parts.slice(0, i - 1), '*'].join(':');
    if (permissionsSet.has(wildcard)) {
      return true;
    }
  }

  return false;
};

/**
 * Check if user has all of the required permissions
 */
export const hasAllPermissions = (userPermissions: Set<string> | string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
};

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (userPermissions: Set<string> | string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
};

/**
 * Get all permissions for a specific role (Helper for backward compatibility)
 * Note: This depends on PREDEFINED_ROLES which is in another file.
 * To avoid circular deps, we can import it or define it elsewhere.
 */
import { PREDEFINED_ROLES } from '../roles/predefined-roles';
export const getBasePermissionsForRole = (role: string): string[] => {
  return (PREDEFINED_ROLES as any)[role]?.permissions || [];
};
